const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const Player = require('../models/Player');
const { authMiddleware } = require('../middleware/auth');
const { getCache }       = require('../config/redis');

const signToken = (player) =>
  jwt.sign(
    { id: player._id, username: player.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password)
      return res.status(400).json({ error: 'All fields required' });

    const exists = await Player.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ error: 'Username or email already taken' });

    const player = await Player.create({ username, email, password });
    const token  = signToken(player);
    res.status(201).json({ token, player: player.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const player = await Player.findOne({ email });
    if (!player || !(await player.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    player.status   = 'online';
    player.lastSeen = new Date();
    await player.save();

    const token = signToken(player);
    await getCache().setex(`session:${player._id}`, 604800, token);
    res.json({ token, player: player.toPublic() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    await getCache().setex(`blacklist:${token}`, 604800, '1');
    await Player.findByIdAndUpdate(req.player.id, { status: 'offline', lastSeen: new Date() });
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const player = await Player.findById(req.player.id).select('-password');
    res.json({ player });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
