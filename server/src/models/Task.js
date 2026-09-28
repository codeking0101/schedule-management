const mongoose = require('mongoose');
const { jsonOptions } = require('../utils');

const { ObjectId } = mongoose.Schema.Types;

const STATUSES = ['todo', 'in_progress', 'review', 'done'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];

const commentSchema = new mongoose.Schema(
  {
    author: { type: ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 5000 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const taskSchema = new mongoose.Schema(
  {
    project: { type: ObjectId, ref: 'Project', required: true, index: true },
    number: { type: Number, required: true },
    key: { type: String, required: true }, // e.g. WEB-12
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 10000 },
    status: { type: String, enum: STATUSES, default: 'todo' },
    priority: { type: String, enum: PRIORITIES, default: 'medium' },
    assignee: { type: ObjectId, ref: 'User', default: null },
    reporter: { type: ObjectId, ref: 'User', required: true },
    // Dates are calendar days (stored at UTC midnight, read back with .slice(0, 10))
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    estimateHours: { type: Number, default: null, min: 0 },
    comments: [commentSchema],
  },
  { timestamps: true }
);

taskSchema.index({ project: 1, number: 1 }, { unique: true });
taskSchema.set('toJSON', jsonOptions);

module.exports = mongoose.model('Task', taskSchema);
module.exports.STATUSES = STATUSES;
module.exports.PRIORITIES = PRIORITIES;
