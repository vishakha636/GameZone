const Redis = require('ioredis');

let pubClient, subClient, cacheClient;

const createRedisClient = () => {
  const client = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    lazyConnect: false,
  });
  client.on('connect', () => console.log('[Redis] Client connected'));
  client.on('error', (err) => console.error('[Redis] Error:', err.message));
  return client;
};

const initRedis = () => {
  pubClient   = createRedisClient();
  subClient   = createRedisClient();
  cacheClient = createRedisClient();
  return { pubClient, subClient, cacheClient };
};

const getCache = () => cacheClient;
const getPub   = () => pubClient;
const getSub   = () => subClient;

module.exports = { initRedis, getCache, getPub, getSub };
