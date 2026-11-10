class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

function errorHandler(err, req, res, _next) {
  if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Already exists: ' + err.errors.map((e) => e.path).join(', ') });
  if (err.name === 'SequelizeValidationError') return res.status(400).json({ error: err.errors.map((e) => e.message).join(', ') });
  const status = err.status || 500;
  if (status === 500) console.error(err);
  res.status(status).json({ error: status === 500 ? 'Server error' : err.message });
}
module.exports = { HttpError, wrap, errorHandler };
