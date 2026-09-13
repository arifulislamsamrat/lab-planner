const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/searchService');

const global = asyncHandler(async (req, res) => {
  const data = await service.globalSearch(req.user, req.query.q, req.query.limit);
  res.json({ data });
});

module.exports = { global };
