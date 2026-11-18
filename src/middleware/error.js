module.exports = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';

  if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'Email already in use';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Invalid or expired token';
  } else if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Malformed JSON';
  }

  if (status === 500) console.error(err);
  res.status(status).json({ message: status === 500 ? 'Server error' : message });
};
