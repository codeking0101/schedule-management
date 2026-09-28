const router = require('express').Router();
const User = require('../models/User');
const { requireAuth, requireAdmin } = require('../middleware/auth');
const { asyncHandler, httpError } = require('../utils');

router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    res.json(await User.find().sort({ name: 1 }));
  })
);

// Admin adds a teammate
router.post(
  '/',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body || {};
    if (!name || !email || !password) throw httpError(400, 'Name, email and password are required');
    if (String(password).length < 8) throw httpError(400, 'Password must be at least 8 characters');
    const clean = String(email).toLowerCase().trim();
    if (await User.findOne({ email: clean })) throw httpError(409, 'An account with this email already exists');

    const user = new User({ name, email: clean, role: role === 'admin' ? 'admin' : 'member' });
    await user.setPassword(password);
    await user.save();
    res.status(201).json(user);
  })
);

// Admin changes a role, name or password
router.patch(
  '/:id',
  requireAdmin,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (!user) throw httpError(404, 'User not found');
    const { role, password, name } = req.body || {};

    if (role !== undefined) {
      if (!['admin', 'member'].includes(role)) throw httpError(400, 'Invalid role');
      if (user.role === 'admin' && role !== 'admin') {
        const admins = await User.countDocuments({ role: 'admin' });
        if (admins <= 1) throw httpError(400, 'There must be at least one admin');
      }
      user.role = role;
    }
    if (name) user.name = name;
    if (password !== undefined) {
      if (String(password).length < 8) throw httpError(400, 'Password must be at least 8 characters');
      await user.setPassword(password);
    }
    await user.save();
    res.json(user);
  })
);

module.exports = router;
