const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/roleService');

const list = asyncHandler(async (_req, res) => {
  const data = await service.listRoles();
  res.json({ data });
});

module.exports = { list };
