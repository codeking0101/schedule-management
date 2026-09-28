const mongoose = require('mongoose');
const { jsonOptions } = require('../utils');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    // Short prefix used in task keys, e.g. WEB -> WEB-12
    key: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: [/^[A-Z][A-Z0-9]{1,9}$/, 'Key must be 2-10 letters or digits and start with a letter'],
    },
    description: { type: String, default: '', maxlength: 1000 },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    taskCounter: { type: Number, default: 0 },
  },
  { timestamps: true }
);

projectSchema.set('toJSON', jsonOptions);

module.exports = mongoose.model('Project', projectSchema);
