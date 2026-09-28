const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { jsonOptions } = require('../utils');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'member'], default: 'member' },
  },
  { timestamps: true }
);

userSchema.methods.setPassword = async function (password) {
  this.passwordHash = await bcrypt.hash(String(password), 10);
};

userSchema.methods.checkPassword = function (password) {
  return bcrypt.compare(String(password), this.passwordHash);
};

userSchema.set('toJSON', jsonOptions);

module.exports = mongoose.model('User', userSchema);
