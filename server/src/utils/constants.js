const COURSE_STATUSES = ['ACTIVE', 'DRAFT', 'ARCHIVED'];

const ITEM_STATUSES = ['PLANNED', 'IN_PROGRESS', 'DONE'];

const LAB_STATUSES = ['BACKLOG', 'PLANNED', 'IN_PROGRESS', 'REVIEW', 'DONE'];

// Per-stage status used inside a lab's review[] array.
const LAB_REVIEW_STATUSES = ['OPEN', 'RESOLVED'];

const ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR', 'MINION'];

const ROLE_LABELS = {
  ADMIN: 'Admin',
  COURSE_COORDINATOR: 'Course Coordinator',
  INSTRUCTOR: 'Instructor',
  MINION: 'Minion',
};

const ROLE_DESCRIPTIONS = {
  ADMIN: 'Full control over the system. Manages users, roles, and all content.',
  COURSE_COORDINATOR: 'Plans courses, milestones, modules, lab groups, and labs.',
  INSTRUCTOR: 'Reviews labs, leaves comments, and changes lab status. Read-only on planning.',
  MINION: 'Authors lab documents and updates lab status. Read-only on planning.',
};

// Roles that may write the planning tree (courses/milestones/modules/labGroups).
const PLANNING_WRITE_ROLES = ['ADMIN', 'COURSE_COORDINATOR'];

// Roles that may write labs (the lab document itself).
const LAB_WRITE_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'MINION'];

// Roles that may change a lab's status (broader than writing the lab doc).
const LAB_STATUS_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR', 'MINION'];

// Roles that may delete a course.
const COURSE_DELETE_ROLES = ['ADMIN', 'COURSE_COORDINATOR'];

// Roles that may review labs (open / resolve / accept a review stage).
// Instructors, course coordinators, and admins are reviewers. Minions are not.
const REVIEWER_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'];

// Roles that may assign a lab to a minion.
// Admins, course coordinators, and instructors can all assign labs.
const ASSIGNMENT_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'];

module.exports = {
  COURSE_STATUSES,
  ITEM_STATUSES,
  LAB_STATUSES,
  LAB_REVIEW_STATUSES,
  ROLES,
  ROLE_LABELS,
  ROLE_DESCRIPTIONS,
  PLANNING_WRITE_ROLES,
  LAB_WRITE_ROLES,
  LAB_STATUS_ROLES,
  COURSE_DELETE_ROLES,
  REVIEWER_ROLES,
  ASSIGNMENT_ROLES,
};
