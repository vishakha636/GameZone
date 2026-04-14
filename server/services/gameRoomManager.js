const { getCache, getPub } = require('../config/redis');
const Match  = require('../models/Match');
const Player = require('../models/Player');

// Import all game engines
const TicTacToe = require('../game/tictactoe');
const Quiz      = require('../game/quiz');
const Ludo      = require('../game/ludo');
const Uno       = require('../game/uno');

// In-memory rooms on THIS server instance
// Map<roomId, { state, gameType, players, connectedCount, maxPlayers }>
const activeRooms = new Map();

// ------------------------------------------------------------------
// Initialize a room when first player joins
// ------------------------------------------------------------------
const initRoom = async (roomId, gameType, players, maxPlayers) => {
  const playerIds = players.map(p => p.playerId.toString());
  let state;

  switch (gameType) {
    case 'tictactoe': state = TicTacToe.createState(); break;
    case 'quiz':      state = Quiz.createState(2);     break;
    case 'trivia3':   state = Quiz.createState(3);     break;
    case 'ludo':      state = Ludo.createState();      break;
    case 'uno':       state = Uno.createState(playerIds); break;
    default: throw new Error(`Unknown game type: ${gameType}`);
  }

  const room = { state, gameType, players, connectedCount: 0, maxPlayers };
  activeRooms.set(roomId, room);

  await Match.findOneAndUpdate(
    { roomId },
    { gameState: state, startedAt: new Date() }
  );

  return state;
};

// ------------------------------------------------------------------
// Mark a player as connected — start game when all are in
// ------------------------------------------------------------------
const playerConnected = async (roomId, playerId) => {
  const room = activeRooms.get(roomId);
  if (!room) return null;

  room.connectedCount = Math.min(room.connectedCount + 1, room.maxPlayers);

  if (room.connectedCount === room.maxPlayers) {
    await Match.findOneAndUpdate({ roomId }, { status: 'active' });
    return { allConnected: true, state: room.state };
  }

  return { allConnected: false, connectedCount: room.connectedCount };
};

// ------------------------------------------------------------------
// Process a move for any game type
// ------------------------------------------------------------------
const processMove = async (roomId, playerId, moveData) => {
  const room = activeRooms.get(roomId);
  if (!room) return { error: 'Room not found on this server' };
  if (room.state.status !== 'active') return { error: 'Game is not active' };

  const normalizedPlayers = room.players.map(p => ({
    ...p,
    playerId: p.playerId.toString(),
  }));

  let newState;

  switch (room.gameType) {
    case 'tictactoe':
      newState = TicTacToe.applyMove(room.state, playerId, moveData, normalizedPlayers);
      break;

    case 'quiz':
    case 'trivia3':
      newState = Quiz.applyMove(room.state, playerId, moveData);
      break;

    case 'ludo':
      if (moveData.action === 'roll') {
        newState = Ludo.rollDice(room.state, playerId, normalizedPlayers);
      } else {
        newState = Ludo.movePiece(room.state, playerId, moveData, normalizedPlayers);
      }
      break;

    case 'uno':
      if (moveData.action === 'draw') {
        newState = Uno.drawCard(room.state, playerId);
      } else {
        newState = Uno.playCard(room.state, playerId, moveData);
      }
      break;

    default:
      return { error: `No handler for game type: ${room.gameType}` };
  }

  if (newState?.error) return newState;

  room.state = newState;

  // Persist move + state to MongoDB
  await Match.findOneAndUpdate(
    { roomId },
    {
      gameState: newState,
      $push: { moves: { playerId, move: moveData, timestamp: new Date() } },
    }
  );

  // Broadcast via Redis pub/sub → all servers relay to their clients
  await getPub().publish('game:move', JSON.stringify({
    roomId,
    state: newState,
    moveData,
    playerId,
  }));

  // Handle game over
  const isOver = ['finished', 'draw'].includes(newState.status);
  if (isOver) await handleGameEnd(roomId, room, newState);

  return { state: newState };
};

// ------------------------------------------------------------------
// Handle game end — update stats, clean up room
// ------------------------------------------------------------------
const handleGameEnd = async (roomId, room, state) => {
  let winnerId = null;

  switch (room.gameType) {
    case 'tictactoe':
      winnerId = TicTacToe.getWinnerId(state, room.players.map(p => ({
        ...p, playerId: p.playerId.toString(),
      })));
      break;

    case 'quiz':
    case 'trivia3':
      winnerId = Quiz.getWinnerId(state, room.players);
      break;

    case 'ludo':
      winnerId = Ludo.getWinnerId(state, room.players.map(p => ({
        ...p, playerId: p.playerId.toString(),
      })));
      break;

    case 'uno':
      winnerId = Uno.getWinnerId(state);
      break;
  }

  await Match.findOneAndUpdate(
    { roomId },
    {
      status:  'finished',
      winner:  winnerId,
      isDraw:  state.status === 'draw',
      endedAt: new Date(),
    }
  );

  // Update stats for all players
  for (const p of room.players) {
    const pid = p.playerId.toString();
    const update = { $inc: { 'stats.totalGames': 1 } };

    if (state.status === 'draw') {
      update.$inc['stats.draws'] = 1;
    } else if (pid === winnerId) {
      update.$inc['stats.wins']  = 1;
      update.$inc['stats.totalScore'] = 10;
    } else {
      update.$inc['stats.losses'] = 1;
    }

    await Player.findByIdAndUpdate(p.playerId, update);
  }

  // Invalidate leaderboard cache
  await getCache().del('leaderboard:top50');

  // Notify all servers the room is done
  await getPub().publish('game:over', JSON.stringify({ roomId, winnerId, isDraw: state.status === 'draw' }));

  activeRooms.delete(roomId);
  console.log(`[Room] ${roomId} finished. Winner: ${winnerId || 'draw'}`);
};

const getRoom    = (roomId) => activeRooms.get(roomId);
const removeRoom = (roomId) => activeRooms.delete(roomId);
const getRoomCount = () => activeRooms.size;

module.exports = { initRoom, playerConnected, processMove, getRoom, removeRoom, getRoomCount };
