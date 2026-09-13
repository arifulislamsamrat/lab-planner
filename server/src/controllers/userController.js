const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/userService');

const list = asyncHandler(async (_req, res) => {
  const data = await service.listUsers();
  res.json({ data });
});

const create = asyncHandler(async (req, res) => {
  const data = await service.createUser(req.body);
  res.status(201).json({ data });
});

const update = asyncHandler(async (req, res) => {
  const data = await service.updateUser(req.params.id, req.body);
  res.json({ data });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteUser(req.params.id);
  res.status(204).end();
});

module.exports = { list, create, update, remove };
