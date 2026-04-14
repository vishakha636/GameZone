require('dotenv').config();
const express    = require('express');
const http       = require('http');
const { Server } = require('socket.io');
const { createAdapter } = require('@socket.io/redis-adapter');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const cron       = require('node-cron');

const connectDB   = require('./config/db');
const { initRedis, getPub, getSub, getCache } = require('./config/redis');
const { socketAuthMiddleware } = require('./middleware/auth');
const setupSocketHandlers = require('./services/socketHandler');
const { getRoomCount }    = require('./services/gameRoomManager');

const authRoutes    = require('./routes/auth');
const playerRoutes  = require('./routes/players');
const matchRoutes   = require('./routes/matches');

const app    = express();
const server = http.createServer(app);

// ── Middleware ───────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(express.json());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, slow down' },
}));
let onlinePlayers = 0; 

// ── REST Routes ──────────────────────────────────────────────────
app.use('/api/auth',    authRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/matches', matchRoutes);

app.get('/api/players/online', (req, res) => {
  res.json({ count: onlinePlayers });
});
app.get('/health', (req, res) => {
  res.json({
    status:     'ok',
    server:     process.env.SERVER_ID || 'server-1',
    rooms:      getRoomCount(),
    timestamp:  new Date().toISOString(),
  });
});

// ── Bootstrap ────────────────────────────────────────────────────
const bootstrap = async () => {
  await connectDB();

  const { pubClient, subClient } = initRedis();

  // Socket.IO with Redis adapter — syncs events across all server instances
  const io = new Server(server, {
    cors: { origin: process.env.CLIENT_URL || '*', credentials: true },
    adapter: createAdapter(pubClient, subClient),
    pingTimeout:  20000,
    pingInterval: 10000,
  });

  io.use(socketAuthMiddleware);
  setupSocketHandlers(io);
  io.on('connection', (socket) => {
    onlinePlayers++;
    socket.on('disconnect', () => {
      onlinePlayers = Math.max(onlinePlayers - 1, 0);
    });
  });

  // Cron: clear leaderboard cache every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    await getCache().del('leaderboard:top50');
    console.log('[Cron] Leaderboard cache invalidated');
  });

  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`\n🎮 ${process.env.SERVER_ID || 'server-1'} running on port ${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/health\n`);
  });
};

bootstrap().catch((err) => {
  console.error('Bootstrap failed:', err);
  process.exit(1);
});
