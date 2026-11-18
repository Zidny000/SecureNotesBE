const User = require('../models/User');
const Note = require('../models/Note');
const Post = require('../models/Post');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const normalizeInterests = require('../utils/interests');
const { getPagination, pageMeta } = require('../utils/pagination');

exports.me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id); // _id index
  res.json(user);
});

// ADMIN: list users (paginated, newest first)
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [data, total] = await Promise.all([
    User.find().sort({ _id: -1 }).skip(skip).limit(limit), // built-in _id index
    User.estimatedDocumentCount(),
  ]);
  res.json({ data, pagination: pageMeta(page, limit, total) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json(user);
});

exports.create = asyncHandler(async (req, res) => {
  const { name, email, password, role, interests } = req.body;
  const user = await User.create({ name, email, password, role, interests: normalizeInterests(interests) });
  res.status(201).json(user);
});

exports.update = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  const { name, email, password, role, interests } = req.body;
  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (password !== undefined) user.password = password; // hashed by pre-save hook
  if (role !== undefined) {
    if (user._id.equals(req.user._id) && role !== 'admin') throw new ApiError(400, 'You cannot demote yourself');
    user.role = role;
  }
  if (interests !== undefined) user.interests = normalizeInterests(interests);

  await user.save();
  res.json(user);
});

exports.remove = asyncHandler(async (req, res) => {
  if (req.params.id === req.user._id.toString()) throw new ApiError(400, 'You cannot delete yourself');
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) throw new ApiError(404, 'User not found');

  // cascade (both use the { owner|author, _id } indexes)
  await Promise.all([Note.deleteMany({ owner: user._id }), Post.deleteMany({ author: user._id })]);
  res.status(204).end();
});

/*
 * SCENARIO 1 
 */
exports.groupByInterests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const interest = req.query.interest ? String(req.query.interest).trim().toLowerCase() : null;

  const pipeline = [];
  if (interest) pipeline.push({ $match: { interests: interest } }); // index-backed
  pipeline.push(
    { $unwind: '$interests' },
    ...(interest ? [{ $match: { interests: interest } }] : []),
    {
      $group: {
        _id: '$interests',
        count: { $sum: 1 },
        users: { $push: { _id: '$_id', name: '$name', email: '$email' } },
      },
    },
    { $sort: { _id: 1 } },
    {
      $facet: {
        data: [{ $skip: skip }, { $limit: limit }, { $project: { _id: 0, interest: '$_id', count: 1, users: 1 } }],
        total: [{ $count: 'n' }],
      },
    }
  );

  const [result] = await User.aggregate(pipeline);
  const total = result.total[0] ? result.total[0].n : 0;
  res.json({ data: result.data, pagination: pageMeta(page, limit, total) });
});
