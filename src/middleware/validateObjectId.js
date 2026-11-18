const ApiError = require('../utils/ApiError');

module.exports = (param) => (req, res, next) => {
  if (!/^[a-f\d]{24}$/i.test(req.params[param])) return next(new ApiError(400, `Invalid ${param}`));
  next();
};
