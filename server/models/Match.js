const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  roomId:   { type: String, required: true, unique: true },
  gameType: {
    type: String,
    enum: ['tictactoe', 'quiz', 'trivia3', 'ludo', 'uno'],
    default: 'tictactoe',
  },
  maxPlayers: { type: Number, default: 2 },
  status: {
    type: String,
    enum: ['waiting', 'active', 'finished', 'abandoned'],
    default: 'waiting',
  },
  players: [{
    playerId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    username:  String,
    symbol:    String,
    score:     { type: Number, default: 0 },
    connected: { type: Boolean, default: true },
  }],
  gameState:       { type: mongoose.Schema.Types.Mixed, default: {} },
  winner:          { type: mongoose.Schema.Types.ObjectId, ref: 'Player', default: null },
  winners:         [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
  isDraw:          { type: Boolean, default: false },
  moves: [{
    playerId:  mongoose.Schema.Types.ObjectId,
    move:      mongoose.Schema.Types.Mixed,
    timestamp: { type: Date, default: Date.now },
  }],
  serverInstance: String,
  startedAt:      Date,
  endedAt:        Date,
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
