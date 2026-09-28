const mongoose = require('mongoose');
const Project = require('./models/Project');
const { httpError } = require('./utils');

// Works for both raw ObjectIds and populated documents.
const idOf = (v) => String(v && v._id ? v._id : v);

const isMember = (project, user) =>
  user.role === 'admin' || project.members.some((m) => idOf(m) === String(user._id));

const isManager = (project, user) =>
  user.role === 'admin' || idOf(project.owner) === String(user._id);

async function loadProjectFor(projectId, user, { manage = false } = {}) {
  if (!mongoose.isValidObjectId(projectId)) throw httpError(404, 'Project not found');
  const project = await Project.findById(projectId);
  if (!project) throw httpError(404, 'Project not found');
  if (!isMember(project, user)) throw httpError(403, 'You are not a member of this project');
  if (manage && !isManager(project, user)) {
    throw httpError(403, 'Only the project owner or an admin can do this');
  }
  return project;
}

module.exports = { idOf, isMember, isManager, loadProjectFor };
