// Express 4 does not catch rejected promises, so wrap async handlers.
exports.asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

exports.httpError = (status, message) => {
  const err = new Error(message);
  err.status = status;
  return err;
};

// Used by every schema: expose `id` instead of `_id`, hide internals.
exports.jsonOptions = {
  transform: (doc, ret) => {
    if (ret._id !== undefined) {
      ret.id = ret._id;
      delete ret._id;
    }
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
};
