// Pure Tic Tac Toe game logic — no side effects

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
];

const createState = () => ({
  cells:       Array(9).fill(null),
  currentTurn: 'X',
  status:      'active',   // active | finished | draw
  winner:      null,
  winCombo:    null,
});

const applyMove = (state, playerId, moveData, players) => {
  const { cellIndex } = moveData;
  const player = players.find(p => p.playerId === playerId);
  if (!player) return { error: 'Player not in room' };

  if (state.status !== 'active')          return { error: 'Game already over' };
  if (state.currentTurn !== player.symbol) return { error: 'Not your turn' };
  if (state.cells[cellIndex] !== null)     return { error: 'Cell already taken' };

  const cells   = [...state.cells];
  cells[cellIndex] = player.symbol;

  const winCombo = WINNING_COMBOS.find(c => c.every(i => cells[i] === player.symbol)) || null;
  const isDraw   = !winCombo && cells.every(c => c !== null);

  return {
    cells,
    currentTurn: player.symbol === 'X' ? 'O' : 'X',
    status:  winCombo ? 'finished' : isDraw ? 'draw' : 'active',
    winner:  winCombo ? player.symbol : null,
    winCombo,
  };
};

const getWinnerId = (state, players) => {
  if (!state.winner) return null;
  return players.find(p => p.symbol === state.winner)?.playerId || null;
};

module.exports = { createState, applyMove, getWinnerId };
