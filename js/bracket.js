// ─── Bracket Renderer (index.html) ──────────────────────────────────────────

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

  // Build column flex widths proportional to 1/numGamesInRound
  const colWidths = div.columns.map(col => {
    const gameSlots = col.slots.filter(s => s.gameId !== null);
    return gameSlots.length;
  });
  const maxGames = Math.max(...colWidths);

  // Build round labels row
  let labelsHtml = div.columns.map((col, i) => {
    const w = `flex: ${maxGames / colWidths[i]}`;
    return `<div class="round-label-cell" style="${w}">${col.label}</div>`;
  }).join('<div style="flex:0 0 40px"></div>') + '<div style="flex:0 0 180px"></div>';

  // Build bracket body columns
  let bodyHtml = '';
  div.columns.forEach((col, colIdx) => {
    const totalFlex = col.slots.reduce((sum, s) => sum + s.flex, 0);

    let slotsHtml = col.slots.map(slot => {
      const slotStyle = `flex: ${slot.flex}`;
      if (!slot.gameId) {
        return `<div class="bracket-slot empty" style="${slotStyle}"></div>`;
      }
      return `<div class="bracket-slot" style="${slotStyle}" data-slot="${slot.gameId}">
        ${renderGameCard(games, slot.gameId)}
      </div>`;
    }).join('');

    bodyHtml += `<div class="bracket-col" style="flex:${maxGames / colWidths[colIdx]}" data-col="${colIdx}">${slotsHtml}</div>`;
    if (colIdx < div.columns.length - 1) {
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

  // Draw connector lines after layout
  requestAnimationFrame(() => drawConnectors(divKey, div.connections, games));
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

// ─── Tab Logic ────────────────────────────────────────────────────────────────
function switchTab(divKey) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.div === divKey));
  document.querySelectorAll('.division-panel').forEach(p => p.classList.toggle('active', p.id === `panel-${divKey}`));
  renderBracket(divKey);
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
