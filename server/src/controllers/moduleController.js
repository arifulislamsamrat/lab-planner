const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/moduleService');

const list = asyncHandler(async (req, res) => {
  const data = await service.listByMilestone(req.params.milestoneId);
  res.json({ data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await service.getById(req.params.id);
  res.json({ data });
});

const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.params.milestoneId, req.body);
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

const reorder = asyncHandler(async (req, res) => {
  await service.reorder(req.params.milestoneId, req.body.items);
  res.json({ data: { ok: true } });
});

module.exports = { list, getOne, create, update, remove, reorder };