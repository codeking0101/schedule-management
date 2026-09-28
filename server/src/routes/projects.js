const router = require('express').Router();
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');
const { loadProjectFor, idOf } = require('../access');
const { asyncHandler, httpError } = require('../utils');

router.use(requireAuth);

const populate = [{ path: 'members' }, { path: 'owner' }];

// Keep only real users, remove duplicates, and always include the owner.
async function cleanMembers(ownerId, members) {
  const wanted = new Set([String(ownerId), ...(Array.isArray(members) ? members.map(String) : [])]);
  const found = await User.find({ _id: { $in: [...wanted].filter((id) => /^[a-f0-9]{24}$/i.test(id)) } }).select('_id');
  return found.map((u) => u._id);
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = req.user.role === 'admin' ? {} : { members: req.user._id };
    res.json(await Project.find(filter).sort({ name: 1 }).populate(populate));
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name, key, description, members } = req.body || {};
    if (!name || !key) throw httpError(400, 'Name and key are required');
    const upperKey = String(key).toUpperCase().trim();
    if (await Project.findOne({ key: upperKey })) throw httpError(409, `The key ${upperKey} is already used by another project`);

    const project = await Project.create({
      name,
      key: upperKey,
      description: description || '',
      owner: req.user._id,
      members: await cleanMembers(req.user._id, members),
    });
    await project.populate(populate);
    res.status(201).json(project);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await loadProjectFor(req.params.id, req.user);
    await project.populate(populate);
    res.json(project);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await loadProjectFor(req.params.id, req.user, { manage: true });
    const { name, description, members } = req.body || {};
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (members !== undefined) project.members = await cleanMembers(idOf(project.owner), members);
    await project.save();
    await project.populate(populate);
    res.json(project);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const project = await loadProjectFor(req.params.id, req.user, { manage: true });
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ ok: true });
  })
);

module.exports = router;
