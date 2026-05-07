// ─── Admin Panel Logic ───────────────────────────────────────────────────────

const SESSION_KEY = 'mygs_admin_auth';

// ─── Auth ─────────────────────────────────────────────────────────────────────
function isAuthed() {
  return sessionStorage.getItem(SESSION_KEY) === 'true';
}

function login(pin) {
  if (pin === ADMIN_PIN) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(SESSION_KEY);
  showLogin();
}

// ─── Screens ──────────────────────────────────────────────────────────────────
function showLogin() {
  document.getElementById('login-screen').style.display = 'flex';
  document.getElementById('admin-dashboard').style.display = 'none';
}

function showDashboard() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('admin-dashboard').style.display = 'block';
  renderAdminPanel('10U');
}

// ─── Admin Rendering ──────────────────────────────────────────────────────────
function getAdminTeamName(games, gameId, slot) {
  const name = resolveTeam(games, gameId, slot);
  if (name) return { text: name, tbd: false };
  const g = games[gameId];
  const srcKey = slot === 1 ? 'team1Source' : 'team2Source';
  if (g && g[srcKey]) return { text: `Winner of ${g[srcKey]}`, tbd: true };
  return { text: 'TBD', tbd: true };
}

function renderAdminPanel(divKey) {
  const div = DIVISIONS[divKey];
  const games = getGames(divKey);
  const panel = document.getElementById(`admin-panel-${divKey}`);
  if (!panel) return;

  const roundOrder = ['Play-In', 'Play-Ins', 'Quarterfinal', 'Semifinal', 'Championship'];
  const byRound = {};
  for (const id in games) {
    const r = games[id].round;
    if (!byRound[r]) byRound[r] = [];
    byRound[r].push(games[id]);
  }

  // Sort games within each round by their ID
  const sortedRounds = roundOrder.filter(r => byRound[r]);

  let html = '';
  sortedRounds.forEach(round => {
    const roundGames = byRound[round].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
    html += `<div class="admin-section-title">${round}s</div>`;
    html += `<div class="admin-game-list">`;

    roundGames.forEach(g => {
      const t1 = getAdminTeamName(games, g.id, 1);
      const t2 = getAdminTeamName(games, g.id, 2);
      const complete = !!g.winner;

      const t1Win = g.winner && g.winner === t1.text;
      const t2Win = g.winner && g.winner === t2.text;

      html += `
        <div class="admin-game-card ${complete ? 'complete' : ''}" id="agame-${divKey}-${g.id}">
          <div class="admin-game-card-header">
            <span class="admin-game-id">${g.id} · ${g.round}</span>
            <span class="admin-game-meta">${g.time} · ${g.field || ''}</span>
          </div>
          <div class="admin-game-body">
            <div class="admin-team-rows">
              <div class="admin-team-row ${t1Win ? 'is-winner' : ''}"
                   onclick="selectWinner('${divKey}','${g.id}',1)"
                   title="Click to mark as winner">
                <span class="winner-indicator">${t1Win ? '🏆' : '○'}</span>
                <span class="admin-team-label ${t1.tbd ? 'tbd' : ''}">${t1.text}</span>
                <input class="score-input" type="number" min="0" max="99"
                       placeholder="—"
                       value="${g.score1 !== null ? g.score1 : ''}"
                       onclick="event.stopPropagation()"
                       onchange="updateScore('${divKey}','${g.id}',1,this.value)"
                       ${t1.tbd ? 'disabled' : ''}>
              </div>
              <div class="admin-team-row ${t2Win ? 'is-winner' : ''}"
                   onclick="selectWinner('${divKey}','${g.id}',2)"
                   title="Click to mark as winner">
                <span class="winner-indicator">${t2Win ? '🏆' : '○'}</span>
                <span class="admin-team-label ${t2.tbd ? 'tbd' : ''}">${t2.text}</span>
                <input class="score-input" type="number" min="0" max="99"
                       placeholder="—"
                       value="${g.score2 !== null ? g.score2 : ''}"
                       onclick="event.stopPropagation()"
                       onchange="updateScore('${divKey}','${g.id}',2,this.value)"
                       ${t2.tbd ? 'disabled' : ''}>
              </div>
            </div>
            <div class="admin-game-actions">
              <button class="btn-set-winner" onclick="promptSetWinner('${divKey}','${g.id}')">
                ${complete ? '✓ Update Result' : 'Set Winner'}
              </button>
              ${complete ? `<button class="btn-clear-game" onclick="clearGame('${divKey}','${g.id}')">Clear</button>` : ''}
            </div>
          </div>
        </div>`;
    });

    html += `</div>`;
  });

  html += `
    <div class="reset-zone">
      <p>⚠️ This will clear all scores and results for the ${divKey} bracket.</p>
      <button class="btn-reset" onclick="confirmReset('${divKey}')">Reset Entire ${divKey} Bracket</button>
    </div>`;

  panel.innerHTML = html;
}

// ─── Game Actions ─────────────────────────────────────────────────────────────
let pendingAction = null;

function selectWinner(divKey, gameId, slot) {
  const games = getGames(divKey);
  const g = games[gameId];
  if (!g) return;

  const t = slot === 1
    ? getAdminTeamName(games, gameId, 1)
    : getAdminTeamName(games, gameId, 2);

  if (t.tbd) {
    showToast('That team is not yet determined.');
    return;
  }

  // Toggle: clicking current winner clears it
  if (g.winner === t.text) {
    g.winner = null;
  } else {
    g.winner = t.text;
  }

  persistGames(divKey, games);
  renderAdminPanel(divKey);
  showToast(g.winner ? `Winner set: ${g.winner}` : 'Winner cleared.');
}

function promptSetWinner(divKey, gameId) {
  const games = getGames(divKey);
  const g = games[gameId];
  const t1 = getAdminTeamName(games, gameId, 1);
  const t2 = getAdminTeamName(games, gameId, 2);

  if (t1.tbd && t2.tbd) {
    showToast('Both teams are still TBD — complete earlier games first.');
    return;
  }

  // If scores are entered, auto-select winner by score
  if (g.score1 !== null && g.score2 !== null) {
    if (g.score1 > g.score2 && !t1.tbd) {
      g.winner = t1.text;
    } else if (g.score2 > g.score1 && !t2.tbd) {
      g.winner = t2.text;
    } else {
      showToast('Scores are tied or teams are TBD. Click a team row to set the winner manually.');
      return;
    }
    persistGames(divKey, games);
    renderAdminPanel(divKey);
    showToast(`Winner set: ${g.winner}`);
  } else {
    showToast('Enter scores first, or click a team row to set the winner directly.');
  }
}

function updateScore(divKey, gameId, slot, value) {
  const games = getGames(divKey);
  const g = games[gameId];
  if (!g) return;
  const parsed = value === '' ? null : parseInt(value, 10);
  if (slot === 1) g.score1 = isNaN(parsed) ? null : parsed;
  else            g.score2 = isNaN(parsed) ? null : parsed;
  persistGames(divKey, games);
  // Don't re-render panel (would lose focus) – just show toast
  showToast('Score saved.');
}

function clearGame(divKey, gameId) {
  const games = getGames(divKey);
  const g = games[gameId];
  if (!g) return;
  g.score1 = null; g.score2 = null; g.winner = null;
  persistGames(divKey, games);
  renderAdminPanel(divKey);
  showToast(`${gameId} result cleared.`);
}

function confirmReset(divKey) {
  if (confirm(`Are you sure you want to reset the entire ${divKey} bracket? This cannot be undone.`)) {
    resetAll(divKey);
    renderAdminPanel(divKey);
    showToast(`${divKey} bracket has been reset.`);
  }
}

// ─── Tab Switch ───────────────────────────────────────────────────────────────
function switchAdminTab(divKey) {
  document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.div === divKey));
  document.querySelectorAll('.admin-panel').forEach(p => p.classList.toggle('active', p.id === `admin-panel-${divKey}`));
  renderAdminPanel(divKey);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Login form
  const pinInput = document.getElementById('pin-input');
  const loginBtn = document.getElementById('login-btn');
  const loginError = document.getElementById('login-error');

  function attemptLogin() {
    const pin = pinInput.value.trim();
    if (login(pin)) {
      showDashboard();
    } else {
      loginError.textContent = 'Incorrect PIN. Please try again.';
      pinInput.classList.add('error');
      pinInput.value = '';
      setTimeout(() => {
        pinInput.classList.remove('error');
        loginError.textContent = '';
      }, 2000);
    }
  }

  loginBtn.addEventListener('click', attemptLogin);
  pinInput.addEventListener('keydown', e => { if (e.key === 'Enter') attemptLogin(); });

  document.getElementById('logout-btn').addEventListener('click', logout);

  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchAdminTab(btn.dataset.div));
  });

  // Check existing session
  if (isAuthed()) {
    showDashboard();
  } else {
    showLogin();
    pinInput.focus();
  }
});
