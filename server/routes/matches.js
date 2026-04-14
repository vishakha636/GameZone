const router  = require('express').Router();
const Match   = require('../models/Match');
const { authMiddleware } = require('../middleware/auth');
const GAME_CONFIG = require('../config/gameConfig');

// GET /api/matches
router.get('/', authMiddleware, async (req, res) => {
  try {
    const matches = await Match.find({ 'players.playerId': req.player.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('players.playerId', 'username avatar');
    res.json(matches);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/:id
router.get('/:id', async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('players.playerId', 'username avatar')
      .populate('winner', 'username');
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/active/rooms  — list all waiting rooms
router.get('/active/rooms', async (req, res) => {
  try {
    const rooms = await Match.find({ status: { $in: ['waiting', 'active'] } })
      .select('roomId gameType maxPlayers players status createdAt')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/matches/config/games  — expose game config to client
router.get('/config/games', (req, res) => {
  res.json(GAME_CONFIG);
});

module.exports = router;
