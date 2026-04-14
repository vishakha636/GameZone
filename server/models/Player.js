const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const playerSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minlength: 3, maxlength: 20 },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  avatar:   { type: String, default: '' },
  stats: {
    wins:       { type: Number, default: 0 },
    losses:     { type: Number, default: 0 },
    draws:      { type: Number, default: 0 },
    totalGames: { type: Number, default: 0 },
    totalScore: { type: Number, default: 0 },
  },
  status:   { type: String, enum: ['online', 'offline', 'in-game'], default: 'offline' },
  lastSeen: { type: Date, default: Date.now },
}, { timestamps: true });

playerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

playerSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

playerSchema.methods.toPublic = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('Player', playerSchema);
