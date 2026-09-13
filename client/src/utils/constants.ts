import type { CourseStatus, LabReviewStatus, LabStatus } from '../types/domain';

export const COURSE_STATUSES: CourseStatus[] = ['ACTIVE', 'DRAFT', 'ARCHIVED'];

export const LAB_STATUSES: LabStatus[] = ['BACKLOG', 'PLANNED', 'IN_PROGRESS', 'REVIEW', 'DONE'];

export const LAB_STATUS_LABELS: Record<LabStatus, string> = {
  BACKLOG: 'Backlog',
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  REVIEW: 'Review',
  DONE: 'Done',
};

export const COURSE_STATUS_LABELS: Record<CourseStatus, string> = {
  ACTIVE: 'Active',
  DRAFT: 'Draft',
  ARCHIVED: 'Archived',
};

export const ITEM_STATUS_LABELS = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
} as const;

// === Lab review stages ===
export const LAB_REVIEW_STATUSES: LabReviewStatus[] = ['OPEN', 'RESOLVED'];

export const LAB_REVIEW_STATUS_LABELS: Record<LabReviewStatus, string> = {
  OPEN: 'Open',
  RESOLVED: 'Resolved',
};

// === /my-labs tabs ===
export const MY_LAB_TABS = [
  'awaiting',
  'pending',
  'in_review',
  'finished',
  'all',
] as const;
export type MyLabTab = (typeof MY_LAB_TABS)[number];

export const MY_LAB_TAB_LABELS: Record<MyLabTab, string> = {
  awaiting: 'Awaiting acceptance',
  pending: 'Pending',
  in_review: 'In Review',
  finished: 'Finished',
  all: 'All',
};

// === Role matrix (mirrors server constants) ===
export const REVIEWER_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'] as const;
export const ASSIGNMENT_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'] as const;