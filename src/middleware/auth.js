const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

exports.authenticate = asyncHandler(async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) throw new ApiError(401, 'Authentication required');

  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.sub).lean(); 
  if (!user) throw new ApiError(401, 'User no longer exists');

  req.user = user;
  next();
});

exports.authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) return next(new ApiError(403, 'Forbidden'));
  next();
};
