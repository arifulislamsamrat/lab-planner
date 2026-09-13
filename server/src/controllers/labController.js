const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/labService');

const list = asyncHandler(async (req, res) => {
  const data = await service.listByLabGroup(req.params.labGroupId);
  res.json({ data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await service.getById(req.params.id);
  res.json({ data });
});

const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.params.labGroupId, req.body);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  res.json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await service.remove(req.params.id);
  res.status(204).end();
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await service.updateStatus(req.params.id, req.body.status);
  res.json({ data });
});

const reorder = asyncHandler(async (req, res) => {
  await service.reorder(req.params.labGroupId, req.body.items);
  res.json({ data: { ok: true } });
});

const reorderAcrossGroups = asyncHandler(async (req, res) => {
  await service.reorderAcrossGroups(req.body.items);
  res.json({ data: { ok: true } });
});

const planning = asyncHandler(async (req, res) => {
  const data = await service.getPlanningTree(req.params.courseId);
  res.json({ data });
});

const addComment = asyncHandler(async (req, res) => {
  const data = await service.addComment(req.params.id, {
    userId: req.user.id,
    userName: req.user.name,
    body: req.body.body,
  });
  res.status(201).json({ data });
});

const removeComment = asyncHandler(async (req, res) => {
  await service.removeComment(req.params.id, req.params.commentId, req.user);
  res.status(204).end();
});

// === Assignment + submission + review workflow ===
const assign = asyncHandler(async (req, res) => {
  const data = await service.assign(req.params.id, req.body.minionId, req.user);
  res.json({ data });
});

const unassign = asyncHandler(async (req, res) => {
  const data = await service.unassign(req.params.id, req.user);
  res.json({ data });
});

const submit = asyncHandler(async (req, res) => {
  const data = await service.submit(req.params.id, req.user);
  res.json({ data });
});

const acceptAssignment = asyncHandler(async (req, res) => {
  const data = await service.acceptAssignment(req.params.id, req.user);
  res.json({ data });
});

const declineAssignment = asyncHandler(async (req, res) => {
  const data = await service.declineAssignment(req.params.id, req.user);
  res.json({ data });
});

const openReview = asyncHandler(async (req, res) => {
  const data = await service.openReviewStage(req.params.id, { feedback: req.body.feedback }, req.user);
  res.json({ data });
});

const resolveReview = asyncHandler(async (req, res) => {
  const data = await service.resolveReviewStage(req.params.id, req.params.stageId, req.user);
  res.json({ data });
});

const acceptLab = asyncHandler(async (req, res) => {
  const data = await service.acceptLab(req.params.id, req.user);
  res.json({ data });
});

const myLabs = asyncHandler(async (req, res) => {
  const data = await service.listMyLabs(req.user, req.query.tab);
  res.json({ data });
});

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
  updateStatus,
  reorder,
  reorderAcrossGroups,
  planning,
  addComment,
  removeComment,
  assign,
  unassign,
  submit,
  acceptAssignment,
  declineAssignment,
  openReview,
  resolveReview,
  acceptLab,
  myLabs,
};