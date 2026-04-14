const jwt = require('jsonwebtoken');
const { getCache } = require('../config/redis');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const blacklisted = await getCache().get(`blacklist:${token}`);
    if (blacklisted) return res.status(401).json({ error: 'Token revoked' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.player = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const socketAuthMiddleware = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.player = decoded;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
};

module.exports = { authMiddleware, socketAuthMiddleware };
