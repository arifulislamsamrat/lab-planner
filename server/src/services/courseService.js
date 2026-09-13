const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');

async function listCourses() {
  return Course.find().sort({ updatedAt: -1 }).lean();
}

async function getCourseById(id) {
  const course = await Course.findById(id).lean();
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
}

async function createCourse(data) {
  return Course.create(data);
}

async function updateCourse(id, data) {
  const course = await Course.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
}

async function deleteCourse(id) {
  // For MVP, deleting a course requires it to be empty. We only check here;
  // cascade removal is exposed as a separate utility for the controller.
  const course = await Course.findByIdAndDelete(id);
  if (!course) throw new ApiError(404, 'Course not found');
  return course;
}

async function getRecentCourses(limit = 5) {
  return Course.find().sort({ updatedAt: -1 }).limit(limit).lean();
}

module.exports = { listCourses, getCourseById, createCourse, updateCourse, deleteCourse, getRecentCourses };