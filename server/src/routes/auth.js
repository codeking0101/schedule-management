const router = require('express').Router();
const User = require('../models/User');
const { requireAuth, signToken } = require('../middleware/auth');
const { asyncHandler, httpError } = require('../utils');

const cleanEmail = (v) => String(v || '').toLowerCase().trim();

// The first account ever created becomes the admin.
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
    if (String(password).length < 8) throw httpError(400, 'Password must be at least 8 characters');

    const count = await User.countDocuments();
    if (count > 0 && process.env.ALLOW_REGISTRATION === 'false') {
      throw httpError(403, 'Sign-up is closed. Ask an admin to add you.');
    }
    if (await User.findOne({ email: cleanEmail(email) })) {
      throw httpError(409, 'An account with this email already exists');
    }

    const user = new User({ name, email: cleanEmail(email), role: count === 0 ? 'admin' : 'member' });
    await user.setPassword(password);
    await user.save();
    res.status(201).json({ token: signToken(user), user });
  })
);

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body || {};
    const user = await User.findOne({ email: cleanEmail(email) }).select('+passwordHash');
    if (!user || !password || !(await user.checkPassword(password))) {
      throw httpError(401, 'Wrong email or password');
    }
    res.json({ token: signToken(user), user });
  })
);

router.get('/me', requireAuth, (req, res) => res.json({ user: req.user }));

module.exports = router;
