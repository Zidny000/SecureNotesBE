const mongoose = require('mongoose');
const Post = require('../models/Post');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, pageMeta } = require('../utils/pagination');

// PUBLIC: all posts, newest first
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const [data, total] = await Promise.all([
    Post.find().sort({ _id: -1 }).skip(skip).limit(limit).populate('author', 'name').lean(),
    Post.estimatedDocumentCount(),
  ]);
  res.json({ data, pagination: pageMeta(page, limit, total) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'name');
  if (!post) throw new ApiError(404, 'Post not found');
  res.json(post);
});

/*
 * SCENARIO 2 
 */
exports.byUser = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);
  const userId = new mongoose.Types.ObjectId(req.params.userId);

  const [result] = await User.aggregate([
    { $match: { _id: userId } }, // _id index
    { $project: { name: 1 } },
    {
      $lookup: {
        from: Post.collection.name,
        let: { uid: '$_id' },
        pipeline: [
          { $match: { $expr: { $eq: ['$author', '$$uid'] } } },
          { $sort: { _id: -1 } },
          { $skip: skip },
          { $limit: limit },
          { $project: { title: 1, content: 1, createdAt: 1, updatedAt: 1 } },
        ],
        as: 'posts',
      },
    },
  ]);
  if (!result) throw new ApiError(404, 'User not found');

  const total = await Post.countDocuments({ author: userId }); 
  res.json({ user: { _id: result._id, name: result.name }, data: result.posts, pagination: pageMeta(page, limit, total) });
});

exports.create = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const post = await Post.create({ title, content, author: req.user._id });
  res.status(201).json(post);
});

exports.update = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title;
  if (content !== undefined) patch.content = content;

  const post = await Post.findOneAndUpdate({ _id: req.params.id, author: req.user._id }, patch, {
    new: true,
    runValidators: true,
  });
  if (!post) throw new ApiError(404, 'Post not found');
  res.json(post);
});

// author or admin can delete
exports.remove = asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin' ? { _id: req.params.id } : { _id: req.params.id, author: req.user._id };
  const post = await Post.findOneAndDelete(filter);
  if (!post) throw new ApiError(404, 'Post not found');
  res.status(204).end();
});
