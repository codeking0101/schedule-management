const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { asyncHandler, httpError } = require('../utils');

const secret = () => process.env.JWT_SECRET || 'dev-only-secret-change-me';

exports.signToken = (user) => jwt.sign({ id: String(user._id) }, secret(), { expiresIn: '7d' });

exports.requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) throw httpError(401, 'Sign in required');

  let payload;
  try {
    payload = jwt.verify(token, secret());
  } catch {
    throw httpError(401, 'Your session expired. Sign in again.');
  }

  const user = await User.findById(payload.id);
  if (!user) throw httpError(401, 'Account not found. Sign in again.');
  req.user = user;
  next();
});

exports.requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') return next(httpError(403, 'Only admins can do this'));
  next();
};
