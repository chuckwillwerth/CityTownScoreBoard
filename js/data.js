// ─── Tournament Bracket Data ────────────────────────────────────────────────
// Edit ADMIN_PIN here to change the admin password.
const ADMIN_PIN = '1994';

const DIVISIONS = {
  '10U': {
    title: 'City/Town 10U Tournament 2026',
    subtitle: '9 Teams · Single Elimination · Tufts',
    games: {
      G1:  { id:'G1',  round:'Play-In',      time:'9:00 AM',  field:'Tufts Parking Lot Field',
             team1:'Everett Mystics',           team2:'Arlington 10 Stars',
             score1:null, score2:null, winner:null },
      G2:  { id:'G2',  round:'Quarterfinal',  time:'9:00 AM',  field:'Tufts Pool Field',
             team1:'Watertown Ruthless Raiders', team2:'Charlestown White',
             score1:null, score2:null, winner:null },
      G3:  { id:'G3',  round:'Quarterfinal',  time:'9:00 AM',  field:'Tufts Playground Field',
             team1:'Winchester All Stars',       team2:'Charlestown Columbia',
             score1:null, score2:null, winner:null },
      G6:  { id:'G6',  round:'Quarterfinal',  time:'10:30 AM', field:'Tufts Playground Field',
             team1:'Medford Mustangs',           team2:'Belmont Thunder',
             score1:null, score2:null, winner:null },
      G9:  { id:'G9',  round:'Quarterfinal',  time:'12:30 PM', field:'Tufts Playground Field',
             team1:'Medford Butterflies',        team1Source:null, team2Source:'G1',
             score1:null, score2:null, winner:null },
      G12: { id:'G12', round:'Semifinal',      time:'2:00 PM',  field:'Tufts Playground Field',
             team1Source:'G3', team2Source:'G6',
             score1:null, score2:null, winner:null },
      G13: { id:'G13', round:'Semifinal',      time:'4:00 PM',  field:'Tufts Playground Field',
             team1Source:'G9', team2Source:'G2',
             score1:null, score2:null, winner:null },
      G14: { id:'G14', round:'Championship',   time:'5:30 PM',  field:'Tufts Pool Field',
             team1Source:'G13', team2Source:'G12',
             score1:null, score2:null, winner:null },
    },
    // columns: each entry is a round column with ordered game IDs (top→bottom)
    // flex values control vertical alignment relative to an 8-slot grid
    columns: [
      { label:'Play-In',      slots:[{ gameId:'G1', flex:1 }, { gameId:null, flex:3 }] },
      { label:'Quarterfinals',slots:[{ gameId:'G9', flex:1 }, { gameId:'G2', flex:1 }, { gameId:'G3', flex:1 }, { gameId:'G6', flex:1 }] },
      { label:'Semifinals',   slots:[{ gameId:'G13', flex:2 }, { gameId:'G12', flex:2 }] },
      { label:'Championship', slots:[{ gameId:'G14', flex:4 }] },
    ],
    // connections: [fromGame, toGame] – SVG draws a line from right-center to left-center
    connections: [
      ['G1','G9'], ['G9','G13'], ['G2','G13'],
      ['G3','G12'], ['G6','G12'],
      ['G13','G14'], ['G12','G14'],
    ],
  },

  '12U': {
    title: 'City/Town 12U Tournament 2026',
    subtitle: '10 Teams · Single Elimination · Tufts',
    games: {
      G4:  { id:'G4',  round:'Play-In',      time:'10:30 AM', field:'Tufts Parking Lot Field',
             team1:'Cambridge Cardinals', team2:'Charlestown',
             score1:null, score2:null, winner:null },
      G5:  { id:'G5',  round:'Play-In',      time:'10:30 AM', field:'Tufts Pool Field',
             team1:'Belmont Lightning',   team2:'Boston Base',
             score1:null, score2:null, winner:null },
      G7:  { id:'G7',  round:'Quarterfinal', time:'12:30 PM', field:'Tufts Parking Lot Field',
             team1:'Winchester Red & Black', team2Source:'G4',
             score1:null, score2:null, winner:null },
      G10: { id:'G10', round:'Quarterfinal', time:'2:00 PM',  field:'Tufts Parking Lot Field',
             team1:'Everett Rip Tide',    team2:'Medford Butterflies',
             score1:null, score2:null, winner:null },
      G11: { id:'G11', round:'Quarterfinal', time:'2:00 PM',  field:'Tufts Pool Field',
             team1:'Arlington 12 Stars', team2:'Medford Mustangs',
             score1:null, score2:null, winner:null },
      G8:  { id:'G8',  round:'Quarterfinal', time:'12:30 PM', field:'Tufts Pool Field',
             team1:'Watertown',           team2Source:'G5',
             score1:null, score2:null, winner:null },
      G15: { id:'G15', round:'Semifinal',    time:'4:00 PM',  field:'Tufts Parking Lot Field',
             team1Source:'G7',  team2Source:'G10',
             score1:null, score2:null, winner:null },
      G16: { id:'G16', round:'Semifinal',    time:'4:00 PM',  field:'Tufts Pool Field',
             team1Source:'G11', team2Source:'G8',
             score1:null, score2:null, winner:null },
      G17: { id:'G17', round:'Championship', time:'5:30 PM',  field:'Tufts Parking Lot Field',
             team1Source:'G15', team2Source:'G16',
             score1:null, score2:null, winner:null },
    },
    columns: [
      { label:'Play-Ins',     slots:[{ gameId:'G4', flex:1 }, { gameId:null, flex:2 }, { gameId:'G5', flex:1 }] },
      { label:'Quarterfinals',slots:[{ gameId:'G7', flex:1 }, { gameId:'G10', flex:1 }, { gameId:'G11', flex:1 }, { gameId:'G8', flex:1 }] },
      { label:'Semifinals',   slots:[{ gameId:'G15', flex:2 }, { gameId:'G16', flex:2 }] },
      { label:'Championship', slots:[{ gameId:'G17', flex:4 }] },
    ],
    connections: [
      ['G4','G7'], ['G5','G8'],
      ['G7','G15'], ['G10','G15'],
      ['G11','G16'], ['G8','G16'],
      ['G15','G17'], ['G16','G17'],
    ],
  },
};

// ─── Persistence ─────────────────────────────────────────────────────────────
function storageKey(div) { return `mygs_bracket_${div}`; }

function loadState(div) {
  try {
    const raw = localStorage.getItem(storageKey(div));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function saveState(div, gamesState) {
  localStorage.setItem(storageKey(div), JSON.stringify(gamesState));
}

// Returns a merged game map: default data + any saved overrides
function getGames(div) {
  const saved = loadState(div);
  const defaults = DIVISIONS[div].games;
  if (!saved) return JSON.parse(JSON.stringify(defaults));
  // Merge: keep structure from defaults, overlay saved scores/winner
  const merged = JSON.parse(JSON.stringify(defaults));
  for (const id in saved) {
    if (merged[id]) {
      merged[id].score1  = saved[id].score1  ?? null;
      merged[id].score2  = saved[id].score2  ?? null;
      merged[id].winner  = saved[id].winner  ?? null;
    }
  }
  return merged;
}

function persistGames(div, games) {
  // Only save the mutable fields
  const slim = {};
  for (const id in games) {
    slim[id] = { score1: games[id].score1, score2: games[id].score2, winner: games[id].winner };
  }
  saveState(div, slim);
}

// Resolve team name: check teamXSource chain
function resolveTeam(games, gameId, slot) {
  const g = games[gameId];
  if (!g) return null;
  const srcKey = slot === 1 ? 'team1Source' : 'team2Source';
  const fixKey = slot === 1 ? 'team1' : 'team2';
  if (g[srcKey]) {
    const src = games[g[srcKey]];
    if (src && src.winner) return src.winner;
    return null; // TBD
  }
  return g[fixKey] || null;
}

function resetAll(div) {
  localStorage.removeItem(storageKey(div));
}
