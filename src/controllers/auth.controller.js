const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const normalizeInterests = require('../utils/interests');

const sign = (user) =>
  jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  });

// Public signup always creates a plain "user" (admins are seeded or created by an admin).
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, interests } = req.body;
  const user = await User.create({ name, email, password, interests: normalizeInterests(interests) });
  res.status(201).json({ token: sign(user), user });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string') throw new ApiError(400, 'Email and password required');

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password'); // email index
  if (!user || !(await user.comparePassword(password))) throw new ApiError(401, 'Invalid credentials');

  res.json({ token: sign(user), user });
});
