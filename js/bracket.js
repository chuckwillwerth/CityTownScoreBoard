// ─── Bracket Renderer (index.html) ──────────────────────────────────────────

// Snapshot at load time so the 60s diff has a baseline
const lastKnownState = {
  '10U': JSON.parse(JSON.stringify(getGames('10U'))),
  '12U': JSON.parse(JSON.stringify(getGames('12U'))),
};

function getDisplayName(games, gameId, slot) {
  const name = resolveTeam(games, gameId, slot);
  if (name) return { text: name, tbd: false };
  const g = games[gameId];
  const srcKey = slot === 1 ? 'team1Source' : 'team2Source';
  if (g && g[srcKey]) return { text: `Winner of ${g[srcKey]}`, tbd: true };
  return { text: 'TBD', tbd: true };
}

function renderGameCard(games, gameId) {
  const g = games[gameId];
  if (!g) return '';

  const t1 = getDisplayName(games, gameId, 1);
  const t2 = getDisplayName(games, gameId, 2);

  const isChamp = g.round === 'Championship';
  const hdrClass = isChamp ? 'championship-header' : '';
  const cardClass = isChamp ? 'championship' : '';

  const t1Winner = g.winner === (t1.tbd ? null : t1.text) && g.winner !== null;
  const t2Winner = g.winner === (t2.tbd ? null : t2.text) && g.winner !== null;

  const t1RowClass = g.winner ? (t1Winner ? 'winner-row' : 'loser-row') : '';
  const t2RowClass = g.winner ? (t2Winner ? 'winner-row' : 'loser-row') : '';

  const s1 = g.score1 !== null ? `<span class="team-score ${t1Winner ? 'winner-score' : ''}">${g.score1}</span>` : '';
  const s2 = g.score2 !== null ? `<span class="team-score ${t2Winner ? 'winner-score' : ''}">${g.score2}</span>` : '';

  return `
    <div class="game-card ${cardClass}" data-game="${gameId}">
      <div class="game-card-header ${hdrClass}">
        <span class="game-id">${gameId}</span>
        <span class="game-time">${g.time}</span>
      </div>
      <div class="game-field">${g.field}</div>
      <div class="game-teams">
        <div class="team-row ${t1RowClass}">
          <span class="winner-crown">${t1Winner ? '🏆' : ''}</span>
          <span class="team-name ${t1.tbd ? 'tbd' : ''}">${t1.text}</span>
          ${s1}
        </div>
        <div class="team-row ${t2RowClass}">
          <span class="winner-crown">${t2Winner ? '🏆' : ''}</span>
          <span class="team-name ${t2.tbd ? 'tbd' : ''}">${t2.text}</span>
          ${s2}
        </div>
      </div>
    </div>`;
}

function renderBracket(divKey) {
  const div = DIVISIONS[divKey];
  const games = getGames(divKey);
  const container = document.getElementById(`bracket-${divKey}`);
  if (!container) return;

  // Find overall champion
  const finalGameId = div.columns[div.columns.length - 1].slots[0].gameId;
  const finalGame = games[finalGameId];
  const champion = finalGame ? finalGame.winner : null;

  // Column flex grows with round importance: earliest = 1, each step adds 0.6
  // Championship (last col) ends up widest; Play-In narrowest but still readable
  const numCols = div.columns.length;
  const colFlex = i => parseFloat((1 + i * 0.6).toFixed(2));

  // Build round labels row (flex must match columns exactly so labels align)
  let labelsHtml = div.columns.map((col, i) =>
    `<div class="round-label-cell" style="flex:${colFlex(i)}">${col.label}</div>`
  ).join('<div style="flex:0 0 40px"></div>') + '<div style="flex:0 0 180px"></div>';

  // Build bracket body columns
  let bodyHtml = '';
  div.columns.forEach((col, colIdx) => {
    const isChampCol = colIdx === numCols - 1;

    let slotsHtml = col.slots.map(slot => {
      const slotStyle = `flex: ${slot.flex}`;
      if (!slot.gameId) {
        return `<div class="bracket-slot empty" style="${slotStyle}"></div>`;
      }
      return `<div class="bracket-slot" style="${slotStyle}" data-slot="${slot.gameId}">
        ${renderGameCard(games, slot.gameId)}
      </div>`;
    }).join('');

    const champClass = isChampCol ? ' bracket-col--championship' : '';
    bodyHtml += `<div class="bracket-col${champClass}" style="flex:${colFlex(colIdx)}" data-col="${colIdx}">${slotsHtml}</div>`;
    if (colIdx < numCols - 1) {
      bodyHtml += `<div class="bracket-col-spacer"></div>`;
    }
  });

  // Champion display
  bodyHtml += `
    <div class="champion-display">
      <div class="champion-trophy">🏆</div>
      <div class="champion-label">${divKey} Champion</div>
      <div class="champion-name ${champion ? '' : 'empty'}">${champion || 'To Be Determined'}</div>
    </div>`;

  container.innerHTML = `
    <div class="bracket-outer">
      <div class="round-labels">${labelsHtml}</div>
      <div class="bracket-body" id="bracket-body-${divKey}">
        <svg class="bracket-svg" id="bracket-svg-${divKey}"></svg>
        ${bodyHtml}
      </div>
    </div>`;

  // Draw connector lines and spotlight active game after layout
  requestAnimationFrame(() => {
    drawConnectors(divKey, div.connections, games);
    spotlightActiveGame(divKey);
  });
}

function drawConnectors(divKey, connections, games) {
  const svg = document.getElementById(`bracket-svg-${divKey}`);
  const body = document.getElementById(`bracket-body-${divKey}`);
  if (!svg || !body) return;

  const bodyRect = body.getBoundingClientRect();
  svg.innerHTML = '';

  connections.forEach(([fromId, toId]) => {
    const fromSlot = body.querySelector(`[data-slot="${fromId}"]`);
    const toSlot   = body.querySelector(`[data-slot="${toId}"]`);
    if (!fromSlot || !toSlot) return;

    const fromRect = fromSlot.getBoundingClientRect();
    const toRect   = toSlot.getBoundingClientRect();

    // Right-center of source slot
    const x1 = fromRect.right - bodyRect.left;
    const y1 = fromRect.top + fromRect.height / 2 - bodyRect.top;

    // Left-center of destination slot
    const x2 = toRect.left - bodyRect.left;
    const y2 = toRect.top + toRect.height / 2 - bodyRect.top;

    const midX = x1 + (x2 - x1) / 2;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`);
    path.setAttribute('stroke', '#D4A00A');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    svg.appendChild(path);
  });
}

// ─── Active Game Spotlight ────────────────────────────────────────────────────

function findMostActiveGame(games) {
  const roundPriority = { Championship: 4, Semifinal: 3, Quarterfinal: 2, 'Play-In': 1 };

  const score = g =>
    (g.score1 !== null || g.score2 !== null) && g.winner === null ? 100 :
    g.winner !== null ? (roundPriority[g.round] || 0) : -1;

  return Object.values(games)
    .filter(g => score(g) > 0)
    .sort((a, b) => score(b) - score(a))[0] || null;
}

function spotlightActiveGame(divKey) {
  const games = getGames(divKey);
  const game  = findMostActiveGame(games);
  if (!game) return;

  const card = document.querySelector(`[data-game="${game.id}"]`);
  if (!card) return;

  const scroll = card.closest('.bracket-scroll');
  if (scroll) {
    const cardRect   = card.getBoundingClientRect();
    const scrollRect = scroll.getBoundingClientRect();
    scroll.scrollLeft += cardRect.left - scrollRect.left - (scrollRect.width / 2) + (cardRect.width / 2);
  }

  document.querySelectorAll('.game-card--spotlight').forEach(el => el.classList.remove('game-card--spotlight'));
  card.classList.add('game-card--spotlight');
  setTimeout(() => card.classList.remove('game-card--spotlight'), 3500);
}

// ─── Score Change Detection ───────────────────────────────────────────────────

function checkForScoreChanges(divKey) {
  const newGames = getGames(divKey);
  const old = lastKnownState[divKey];
  const changed = [];
  for (const id in newGames) {
    const n = newGames[id], o = old[id];
    if (!o) continue;
    if (n.score1 !== o.score1 || n.score2 !== o.score2 || n.winner !== o.winner) {
      changed.push(n);
    }
  }
  lastKnownState[divKey] = JSON.parse(JSON.stringify(newGames));
  return changed;
}

// ─── Score Alert Overlay ──────────────────────────────────────────────────────

function showScoreAlert(game) {
  const overlay = document.getElementById('score-alert');
  if (!overlay) return;

  const t1 = game.team1 || (game.team1Source ? `Winner of ${game.team1Source}` : 'Team 1');
  const t2 = game.team2 || (game.team2Source ? `Winner of ${game.team2Source}` : 'Team 2');
  const s1 = game.score1 !== null ? game.score1 : '–';
  const s2 = game.score2 !== null ? game.score2 : '–';
  const winnerLine = game.winner ? `<div class="sa-winner">🏆 ${game.winner}</div>` : '';

  const confettiColors = ['#F0B429','#1B2D6B','#CC2229','#ffffff','#F4F0E6'];
  const confettiHtml = Array.from({length: 20}, (_, i) => {
    const color = confettiColors[i % confettiColors.length];
    const left  = (i * 5.2 + (i % 3) * 1.4).toFixed(1);
    const delay = ((i % 5) * 0.16).toFixed(2);
    return `<span class="sa-confetti-piece" style="left:${left}%;background:${color};animation-delay:${delay}s"></span>`;
  }).join('');

  overlay.innerHTML = `
    <div class="sa-card">
      <div class="sa-label">Score Update</div>
      <div class="sa-meta">${game.id} · ${game.field} · ${game.time}</div>
      <div class="sa-scores">
        <div class="sa-team ${game.winner === t1 ? 'sa-team--win' : ''}">${t1}<span>${s1}</span></div>
        <div class="sa-vs">VS</div>
        <div class="sa-team ${game.winner === t2 ? 'sa-team--win' : ''}">${t2}<span>${s2}</span></div>
      </div>
      ${winnerLine}
      <div class="sa-dismiss">Tap to dismiss</div>
    </div>
    <div class="sa-confetti" aria-hidden="true">${confettiHtml}</div>`;

  overlay.classList.add('sa--visible');
  overlay.onclick = () => overlay.classList.remove('sa--visible');
  clearTimeout(overlay._timer);
  overlay._timer = setTimeout(() => overlay.classList.remove('sa--visible'), 6000);
}

// ─── Geolocation Field Detection ─────────────────────────────────────────────

// ─── Tab Logic ────────────────────────────────────────────────────────────────
function switchTab(divKey) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.div === divKey));
  document.querySelectorAll('.division-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${divKey}`));
  if (DIVISIONS[divKey]) renderBracket(divKey);
}

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.div));
  });

  // Initial render
  switchTab('10U');

  // Re-draw SVG lines on resize and orientation change
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ['10U', '12U'].forEach(d => {
        const panel = document.getElementById(`panel-${d}`);
        if (panel && panel.classList.contains('active')) renderBracket(d);
      });
    }, 150);
  });
  // 350ms delay gives iOS time to finalize viewport dimensions after rotation
  window.addEventListener('orientationchange', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ['10U', '12U'].forEach(d => {
        const panel = document.getElementById(`panel-${d}`);
        if (panel && panel.classList.contains('active')) renderBracket(d);
      });
    }, 350);
  });

});

// Called by admin page after updates (if opened in same session)
function refreshBracket() {
  ['10U', '12U'].forEach(d => {
    const panel = document.getElementById(`panel-${d}`);
    if (panel && panel.classList.contains('active')) renderBracket(d);
  });
}
