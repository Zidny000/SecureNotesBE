const Note = require('../models/Note');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, pageMeta } = require('../utils/pagination');

const isAdmin = (req) => req.user.role === 'admin';

// USER: own notes. ADMIN: everyone's notes (optionally ?owner=<userId>).
exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req.query);

  let filter;
  if (!isAdmin(req)) filter = { owner: req.user._id };
  else if (req.query.owner && /^[a-f\d]{24}$/i.test(req.query.owner)) filter = { owner: req.query.owner };
  else filter = {};

  const [data, total] = await Promise.all([
    Note.find(filter).sort({ _id: -1 }).skip(skip).limit(limit).populate('owner', 'name email').lean(),
    Object.keys(filter).length ? Note.countDocuments(filter) : Note.estimatedDocumentCount(),
  ]);
  res.json({ data, pagination: pageMeta(page, limit, total) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const note = await Note.findById(req.params.id); // _id index
  if (!note || (!isAdmin(req) && !note.owner.equals(req.user._id))) throw new ApiError(404, 'Note not found');
  res.json(note);
});

exports.create = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.create({ title, content, owner: req.user._id });
  res.status(201).json(note);
});

// update / delete: only the owner (admins manage their own notes like any user)
exports.update = asyncHandler(async (req, res) => {
  const { title, content } = req.body;
  const patch = {};
  if (title !== undefined) patch.title = title;
  if (content !== undefined) patch.content = content;

  const note = await Note.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, patch, {
    new: true,
    runValidators: true,
  });
  if (!note) throw new ApiError(404, 'Note not found');
  res.json(note);
});

exports.remove = asyncHandler(async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!note) throw new ApiError(404, 'Note not found');
  res.status(204).end();
});
