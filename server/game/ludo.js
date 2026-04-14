// Simplified Ludo game logic for 4 players

const COLORS  = ['R', 'G', 'B', 'Y'];
const HOME    = { R: 0, G: 13, B: 26, Y: 39 };
const WIN_POS = 52;

const createState = () => {
  const pieces = {};
  COLORS.forEach(c => {
    pieces[c] = [-1, -1, -1, -1]; // -1 = at home base, 52 = finished
  });
  return {
    pieces,
    currentTurn:  'R',
    diceValue:    null,
    diceRolled:   false,
    status:       'active',
    winner:       null,
    turnOrder:    COLORS,
  };
};

const rollDice = (state, playerId, players) => {
  const player = players.find(p => p.playerId === playerId);
  if (!player || state.currentTurn !== player.symbol) return { error: 'Not your turn' };
  if (state.diceRolled) return { error: 'Already rolled' };

  const diceValue = Math.floor(Math.random() * 6) + 1;
  return { ...state, diceValue, diceRolled: true };
};

const movePiece = (state, playerId, moveData, players) => {
  const { pieceIndex } = moveData;
  const player = players.find(p => p.playerId === playerId);
  if (!player || state.currentTurn !== player.symbol) return { error: 'Not your turn' };
  if (!state.diceRolled) return { error: 'Roll dice first' };

  const color  = player.symbol;
  const pieces = JSON.parse(JSON.stringify(state.pieces));
  const pos    = pieces[color][pieceIndex];

  // Piece at base, needs 6 to enter
  if (pos === -1 && state.diceValue !== 6) return { error: 'Need 6 to enter board' };

  let newPos;
  if (pos === -1) {
    newPos = HOME[color];
  } else {
    newPos = pos + state.diceValue;
    if (newPos > WIN_POS) return { error: 'Cannot move that piece' };
  }

  pieces[color][pieceIndex] = newPos;

  // Check win: all 4 pieces reached WIN_POS
  const won = pieces[color].every(p => p === WIN_POS);

  // Next turn (skip if rolled 6)
  const idx = COLORS.indexOf(color);
  const nextTurn = state.diceValue === 6 ? color : COLORS[(idx + 1) % COLORS.length];

  return {
    ...state,
    pieces,
    diceValue:   null,
    diceRolled:  false,
    currentTurn: won ? color : nextTurn,
    status:      won ? 'finished' : 'active',
    winner:      won ? color : null,
  };
};

const getWinnerId = (state, players) => {
  if (!state.winner) return null;
  return players.find(p => p.symbol === state.winner)?.playerId || null;
};

module.exports = { createState, rollDice, movePiece, getWinnerId };
