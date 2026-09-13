const asyncHandler = require('../utils/asyncHandler');
const labService = require('../services/labService');

const getPlanning = asyncHandler(async (req, res) => {
  const data = await labService.getPlanningTree(req.params.courseId);
  res.json({ data });
});

module.exports = { getPlanning };