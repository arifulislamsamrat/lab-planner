const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/resourceService');

const getLabResource = asyncHandler(async (req, res) => {
  const data = await service.getLabResource(req.params.id);
  res.json(data);
});

module.exports = { getLabResource };