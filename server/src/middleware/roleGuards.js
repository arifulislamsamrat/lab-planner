const { requireRole } = require('./auth');
const {
  PLANNING_WRITE_ROLES,
  LAB_WRITE_ROLES,
  LAB_STATUS_ROLES,
  COURSE_DELETE_ROLES,
  REVIEWER_ROLES,
  ASSIGNMENT_ROLES,
} = require('../utils/constants');

// Per-route guards based on the role matrix documented in the plan.
const requirePlanningWrite = requireRole(...PLANNING_WRITE_ROLES);
const requireLabWrite = requireRole(...LAB_WRITE_ROLES);
const requireLabStatus = requireRole(...LAB_STATUS_ROLES);
const requireCourseDelete = requireRole(...COURSE_DELETE_ROLES);
const requireReviewer = requireRole(...REVIEWER_ROLES);
const requireAssigner = requireRole(...ASSIGNMENT_ROLES);

module.exports = {
  requirePlanningWrite,
  requireLabWrite,
  requireLabStatus,
  requireCourseDelete,
  requireReviewer,
  requireAssigner,
};
