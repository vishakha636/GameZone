const { v4: uuidv4 } = require('uuid');
const { getCache, getPub } = require('../config/redis');
const Match      = require('../models/Match');
const GAME_CONFIG = require('../config/gameConfig');

const QUEUE_KEY = (gameType) => `matchmaking:queue:${gameType}`;
const ROOM_KEY  = (id)       => `room:${id}`;

// Add player to matchmaking queue
const joinQueue = async (playerId, username, gameType = 'tictactoe') => {
  const config = GAME_CONFIG[gameType];
  if (!config) throw new Error(`Unknown game type: ${gameType}`);

  // Remove player from any existing queue first (prevent duplicates)
  await leaveAllQueues(playerId);

  const entry = JSON.stringify({ playerId, username, gameType, joinedAt: Date.now() });
  await getCache().lpush(QUEUE_KEY(gameType), entry);

  const queueLen = await getCache().llen(QUEUE_KEY(gameType));
  console.log(`[Matchmaking] ${username} joined ${gameType} queue. Queue size: ${queueLen}/${config.players}`);

  if (queueLen >= config.players) {
    return await createMatch(gameType, config);
  }

  return null;
};

// Remove player from ALL queues (on disconnect / cancel)
const leaveQueue = async (playerId, gameType = null) => {
  if (gameType) {
    await removeFromQueue(playerId, QUEUE_KEY(gameType));
  } else {
    await leaveAllQueues(playerId);
  }
};

const leaveAllQueues = async (playerId) => {
  const gameTypes = Object.keys(GAME_CONFIG);
  for (const gt of gameTypes) {
    await removeFromQueue(playerId, QUEUE_KEY(gt));
  }
};

const removeFromQueue = async (playerId, queueKey) => {
  const items = await getCache().lrange(queueKey, 0, -1);
  for (const item of items) {
    try {
      const parsed = JSON.parse(item);
      if (parsed.playerId === playerId) {
        await getCache().lrem(queueKey, 1, item);
        break;
      }
    } catch (_) {}
  }
};

// Get current queue position for a player
const getQueuePosition = async (playerId, gameType) => {
  const items = await getCache().lrange(QUEUE_KEY(gameType), 0, -1);
  const idx   = items.findIndex(item => {
    try { return JSON.parse(item).playerId === playerId; } catch (_) { return false; }
  });
  return idx === -1 ? null : idx + 1;
};

// Create a match by popping N players from the queue
const createMatch = async (gameType, config) => {
  const players = [];

  for (let i = 0; i < config.players; i++) {
    const raw = await getCache().rpop(QUEUE_KEY(gameType));
    if (!raw) {
      // Not enough players — push back what we popped and abort
      for (const p of players) {
        await getCache().rpush(QUEUE_KEY(gameType), JSON.stringify(p));
      }
      return null;
    }
    const p = JSON.parse(raw);
    players.push({
      ...p,
      symbol: config.symbols?.[i] || null,
    });
  }

  const roomId = uuidv4();

  const match = await Match.create({
    roomId,
    gameType,
    maxPlayers: config.players,
    status: 'waiting',
    players: players.map(p => ({
      playerId:  p.playerId,
      username:  p.username,
      symbol:    p.symbol,
      score:     0,
      connected: false,
    })),
    serverInstance: process.env.SERVER_ID,
  });

  // Cache room for fast lookup (1 hour TTL)
  await getCache().setex(ROOM_KEY(roomId), 3600, JSON.stringify({
    roomId,
    gameType,
    maxPlayers: config.players,
    players,
    matchId: match._id.toString(),
  }));

  // Broadcast to ALL servers — each server notifies its own clients
  await getPub().publish('match:created', JSON.stringify({
    roomId,
    gameType,
    maxPlayers: config.players,
    playerIds: players.map(p => p.playerId),
  }));

  console.log(`[Matchmaking] Match created: ${roomId} (${gameType}, ${config.players} players)`);
  return { roomId, players, matchId: match._id, gameType };
};

const getRoomInfo = async (roomId) => {
  const raw = await getCache().get(ROOM_KEY(roomId));
  return raw ? JSON.parse(raw) : null;
};

// Get queue lengths for all game types (for lobby display)
const getQueueStatus = async () => {
  const status = {};
  for (const [gameType, config] of Object.entries(GAME_CONFIG)) {
    const len = await getCache().llen(QUEUE_KEY(gameType));
    status[gameType] = {
      inQueue:    len,
      needsMore:  config.players - len,
      maxPlayers: config.players,
    };
  }
  return status;
};

module.exports = { joinQueue, leaveQueue, getRoomInfo, getQueuePosition, getQueueStatus };
