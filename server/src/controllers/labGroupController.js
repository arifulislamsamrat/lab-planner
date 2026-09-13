const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/labGroupService');

const list = asyncHandler(async (req, res) => {
  const data = await service.listByModule(req.params.moduleId);
  res.json({ data });
});

const getOne = asyncHandler(async (req, res) => {
  const data = await service.getById(req.params.id);
  res.json({ data });
});

const create = asyncHandler(async (req, res) => {
  const data = await service.create(req.params.moduleId, req.body);
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
  await service.reorder(req.params.moduleId, req.body.items);
  res.json({ data: { ok: true } });
});

module.exports = { list, getOne, create, update, remove, reorder };