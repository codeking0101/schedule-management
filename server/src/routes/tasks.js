const router = require('express').Router();
const mongoose = require('mongoose');
const Task = require('../models/Task');
const Project = require('../models/Project');
const { requireAuth } = require('../middleware/auth');
const { loadProjectFor, isManager, idOf } = require('../access');
const { asyncHandler, httpError } = require('../utils');

router.use(requireAuth);

const populate = [{ path: 'assignee' }, { path: 'reporter' }, { path: 'comments.author' }];

function parseDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw httpError(400, 'Invalid date');
  return d;
}

// Only copy fields the client is allowed to set.
function pickFields(body = {}) {
  const out = {};
  for (const f of ['title', 'description', 'status', 'priority']) {
    if (body[f] !== undefined) out[f] = body[f];
  }
  if (body.assignee !== undefined) out.assignee = body.assignee || null;
  if (body.startDate !== undefined) out.startDate = parseDate(body.startDate);
  if (body.dueDate !== undefined) out.dueDate = parseDate(body.dueDate);
  if (body.estimateHours !== undefined) {
    out.estimateHours = body.estimateHours === '' || body.estimateHours === null ? null : Number(body.estimateHours);
  }
  return out;
}

function checkRules(project, start, due, assignee) {
  if (start && due && start > due) throw httpError(400, 'Start date must be on or before the due date');
  if (assignee && !project.members.some((m) => idOf(m) === String(assignee))) {
    throw httpError(400, 'The assignee must be a member of this project');
  }
}

async function loadTask(id, user) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, 'Task not found');
  const task = await Task.findById(id);
  if (!task) throw httpError(404, 'Task not found');
  const project = await loadProjectFor(task.project, user);
  return { task, project };
}

router.get(
  '/',
  asyncHandler(async (req, res) => {
    if (!req.query.project) throw httpError(400, 'project is required');
    const project = await loadProjectFor(req.query.project, req.user);
    const tasks = await Task.find({ project: project._id }).sort({ number: 1 }).populate(populate);
    res.json(tasks);
  })
);

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const project = await loadProjectFor(req.body?.project, req.user);
    const fields = pickFields(req.body);
    if (!fields.title || !String(fields.title).trim()) throw httpError(400, 'A title is required');
    checkRules(project, fields.startDate, fields.dueDate, fields.assignee);

    // Atomic counter so two people creating tasks at once never get the same number
    const bumped = await Project.findByIdAndUpdate(project._id, { $inc: { taskCounter: 1 } }, { new: true });
    const task = await Task.create({
      ...fields,
      project: project._id,
      number: bumped.taskCounter,
      key: `${bumped.key}-${bumped.taskCounter}`,
      reporter: req.user._id,
    });
    await task.populate(populate);
    res.status(201).json(task);
  })
);

router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { task } = await loadTask(req.params.id, req.user);
    await task.populate(populate);
    res.json(task);
  })
);

router.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const { task, project } = await loadTask(req.params.id, req.user);
    const fields = pickFields(req.body);

    const start = 'startDate' in fields ? fields.startDate : task.startDate;
    const due = 'dueDate' in fields ? fields.dueDate : task.dueDate;
    const assignee = 'assignee' in fields ? fields.assignee : null; // only re-check when changed
    checkRules(project, start, due, assignee);
    if ('title' in fields && !String(fields.title).trim()) throw httpError(400, 'A title is required');

    task.set(fields);
    await task.save();
    await task.populate(populate);
    res.json(task);
  })
);

router.post(
  '/:id/comments',
  asyncHandler(async (req, res) => {
    const { task } = await loadTask(req.params.id, req.user);
    const text = String(req.body?.text || '').trim();
    if (!text) throw httpError(400, 'Write something before posting a comment');
    task.comments.push({ author: req.user._id, text });
    await task.save();
    await task.populate(populate);
    res.status(201).json(task);
  })
);

router.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { task, project } = await loadTask(req.params.id, req.user);
    const isReporter = idOf(task.reporter) === String(req.user._id);
    if (!isReporter && !isManager(project, req.user)) {
      throw httpError(403, 'Only the reporter, the project owner or an admin can delete this task');
    }
    await task.deleteOne();
    res.json({ ok: true });
  })
);

module.exports = router;
