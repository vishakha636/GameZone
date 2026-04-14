const { joinQueue, leaveQueue, getQueueStatus } = require('./matchmaking');
const { initRoom, playerConnected, processMove, getRoom } = require('./gameRoomManager');
const { getSub, getCache } = require('../config/redis');
const Match = require('../models/Match');

const setupSocketHandlers = (io) => {

  // ── Redis pub/sub subscriptions ─────────────────────────────────
  const sub = getSub();
  sub.subscribe('game:move', 'match:created', 'game:over', (err) => {
    if (err) console.error('[Socket] Redis subscribe error:', err);
    else console.log('[Socket] Subscribed to Redis channels');
  });

  sub.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);

      if (channel === 'game:move') {
        // Relay updated game state to all clients in this room on THIS server
        io.to(data.roomId).emit('game:state', {
          state:    data.state,
          lastMove: data.moveData,
          movedBy:  data.playerId,
        });
      }

      if (channel === 'match:created') {
        // Tell each matched player their game is ready
        data.playerIds.forEach(playerId => {
          io.to(`player:${playerId}`).emit('match:found', {
            roomId:     data.roomId,
            gameType:   data.gameType,
            maxPlayers: data.maxPlayers,
          });
        });
      }

      if (channel === 'game:over') {
        io.to(data.roomId).emit('game:over', {
          winnerId: data.winnerId,
          isDraw:   data.isDraw,
        });
      }

    } catch (err) {
      console.error('[Socket] Redis message parse error:', err.message);
    }
  });

  // ── Socket.IO connection ─────────────────────────────────────────
  io.on('connection', (socket) => {
    const { id: playerId, username } = socket.player;
    console.log(`[Socket] ${username} (${playerId}) connected on ${socket.id}`);

    // Personal room for direct notifications
    socket.join(`player:${playerId}`);

    // ── Matchmaking ────────────────────────────────────────────────
    socket.on('matchmaking:join', async ({ gameType = 'tictactoe' } = {}) => {
      try {
        socket.emit('matchmaking:queued', {
          message:  `Searching for ${gameType} match...`,
          gameType,
        });

        const result = await joinQueue(playerId, username, gameType);
        if (result) {
          // Match found immediately (enough players were already queued)
          socket.emit('matchmaking:matched', { roomId: result.roomId });
        } else {
          // Emit queue status update
          const status = await getQueueStatus();
          socket.emit('queue:status', status);
        }
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    socket.on('matchmaking:leave', async ({ gameType } = {}) => {
      try {
        await leaveQueue(playerId, gameType || null);
        socket.emit('matchmaking:left');
      } catch (err) {
        socket.emit('error', { message: err.message });
      }
    });

    // ── Room join ──────────────────────────────────────────────────
    socket.on('room:join', async ({ roomId } = {}) => {
      try {
        if (!roomId) return socket.emit('error', { message: 'roomId required' });

        socket.join(roomId);

        let room = getRoom(roomId);

        if (!room) {
          // First player on this server to join — load match and init room
          const match = await Match.findOne({ roomId });
          if (!match) return socket.emit('error', { message: 'Room not found' });

          const normalizedPlayers = match.players.map(p => ({
            playerId: p.playerId.toString(),
            username: p.username,
            symbol:   p.symbol,
            score:    p.score,
          }));

          const state = await initRoom(
            roomId,
            match.gameType,
            normalizedPlayers,
            match.maxPlayers
          );

          room = getRoom(roomId);

          socket.emit('room:joined', {
            roomId,
            state,
            gameType:   match.gameType,
            maxPlayers: match.maxPlayers,
            players:    match.players,
          });
        } else {
          socket.emit('room:joined', {
            roomId,
            state:      room.state,
            gameType:   room.gameType,
            maxPlayers: room.maxPlayers,
            players:    room.players,
          });
        }

        // Notify others
        io.to(roomId).emit('player:joined', {
          playerId,
          username,
          connectedCount: room.connectedCount + 1,
          maxPlayers:     room.maxPlayers,
        });

        // Track connection count — start game when all N players connected
        const result = await playerConnected(roomId, playerId);
        if (result?.allConnected) {
          io.to(roomId).emit('game:start', {
            state:   result.state,
            message: 'All players connected! Game starting...',
          });
        } else if (result) {
          io.to(roomId).emit('waiting:players', {
            connectedCount: result.connectedCount,
            maxPlayers:     room.maxPlayers,
            needed:         room.maxPlayers - result.connectedCount,
          });
        }

      } catch (err) {
        console.error('[Socket] room:join error:', err.message);
        socket.emit('error', { message: err.message });
      }
    });

    // ── Game move ──────────────────────────────────────────────────
    socket.on('game:move', async ({ roomId, moveData } = {}) => {
      try {
        if (!roomId || !moveData) return socket.emit('move:error', { message: 'Invalid move data' });

        const result = await processMove(roomId, playerId, moveData);
        if (result.error) return socket.emit('move:error', { message: result.error });
        // State broadcast handled by Redis pub/sub above

      } catch (err) {
        socket.emit('move:error', { message: err.message });
      }
    });

    // ── Chat ───────────────────────────────────────────────────────
    socket.on('chat:message', ({ roomId, message } = {}) => {
      if (!roomId || !message?.trim() || message.length > 200) return;
      io.to(roomId).emit('chat:message', {
        from:      username,
        playerId,
        message:   message.trim(),
        timestamp: Date.now(),
      });
    });

    // ── Ping (keep-alive) ──────────────────────────────────────────
    socket.on('ping', () => socket.emit('pong'));

    // ── Disconnect ─────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      console.log(`[Socket] ${username} disconnected: ${reason}`);

      // Leave all matchmaking queues
      await leaveQueue(playerId);

      // Notify game rooms this player was in
      const rooms = [...socket.rooms].filter(
        r => r !== socket.id && r !== `player:${playerId}`
      );
      for (const roomId of rooms) {
        io.to(roomId).emit('player:disconnected', { playerId, username, reason });
      }
    });

  }); // end io.on('connection')
};

module.exports = setupSocketHandlers;
