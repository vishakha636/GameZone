const router = require('express').Router();
const Player = require('../models/Player');
const { authMiddleware } = require('../middleware/auth');
const { getCache }       = require('../config/redis');

// GET /api/players/online  ← must be BEFORE /:id
router.get('/online', async (req, res) => {
  try {
    const count = await Player.countDocuments({ status: 'online' })
    res.json({ count })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/players/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const cached = await getCache().get('leaderboard:top50');
    if (cached) return res.json(JSON.parse(cached));

    const players = await Player.find()
      .select('username stats avatar')
      .sort({ 'stats.wins': -1, 'stats.totalScore': -1 })
      .limit(50);

    await getCache().setex('leaderboard:top50', 60, JSON.stringify(players));
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/players/:id  ← dynamic route always goes last
router.get('/:id', async (req, res) => {
  try {
    const player = await Player.findById(req.params.id).select('-password');
    if (!player) return res.status(404).json({ error: 'Player not found' });
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/players/profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { avatar } = req.body;
    const player = await Player.findByIdAndUpdate(
      req.player.id, { avatar }, { new: true }
    ).select('-password');
    res.json(player);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;