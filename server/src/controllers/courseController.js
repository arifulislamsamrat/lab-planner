const asyncHandler = require('../utils/asyncHandler');
const service = require('../services/courseService');

const list = asyncHandler(async (req, res) => {
  const courses = await service.listCourses();
  res.json({ data: courses });
});

const getOne = asyncHandler(async (req, res) => {
  const course = await service.getCourseById(req.params.id);
  res.json({ data: course });
});

const create = asyncHandler(async (req, res) => {
  const course = await service.createCourse(req.body);
  res.status(201).json({ data: course });
});

const update = asyncHandler(async (req, res) => {
  const course = await service.updateCourse(req.params.id, req.body);
  res.json({ data: course });
});

const remove = asyncHandler(async (req, res) => {
  await service.deleteCourse(req.params.id);
  res.status(204).end();
});

module.exports = { list, getOne, create, update, remove };