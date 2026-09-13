export type CourseStatus = 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
export type LabStatus = 'BACKLOG' | 'PLANNED' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
export type LabReviewStatus = 'OPEN' | 'RESOLVED';

export interface Course {
  _id: string;
  title: string;
  description: string;
  thumbnail?: string;
  status: CourseStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Milestone {
  _id: string;
  courseId: string;
  title: string;
  description: string;
  order: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  updatedAt: string;
}

export interface ModuleEntity {
  _id: string;
  milestoneId: string;
  title: string;
  description: string;
  order: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  updatedAt: string;
}

export interface LabGroup {
  _id: string;
  moduleId: string;
  title: string;
  description: string;
  order: number;
  status: 'PLANNED' | 'IN_PROGRESS' | 'DONE';
  createdAt: string;
  updatedAt: string;
}

export interface CoursePlanningTree {
  course: Course;
  milestones: Array<
    Milestone & {
      modules: Array<
        ModuleEntity & {
          labGroups: Array<
            LabGroup & { labs: Lab[] }
          >;
        }
      >;
    }
  >;
}

export interface DashboardSummary {
  counts: {
    courses: number;
    milestones: number;
    modules: number;
    labGroups: number;
    labs: number;
  };
  recentCourses: Course[];
}

export interface ApiErrorBody {
  error: { message: string; details?: unknown };
}

export type Role = 'ADMIN' | 'COURSE_COORDINATOR' | 'INSTRUCTOR' | 'MINION';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  COURSE_COORDINATOR: 'Course Coordinator',
  INSTRUCTOR: 'Instructor',
  MINION: 'Minion',
};

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AuthStatus {
  bootstrapped: boolean;
}

export interface LabComment {
  _id: string;
  userId: string;
  userName: string;
  body: string;
  createdAt: string;
}

export interface LabReviewStage {
  _id: string;
  stage: number;
  reviewerId: string;
  reviewerName: string;
  status: LabReviewStatus;
  feedback: string;
  openedAt: string;
  resolvedAt: string | null;
}

export interface Lab {
  _id: string;
  labGroupId: string;
  title: string;
  description: string;
  instructions: string;
  estimatedTime: number;
  order: number;
  status: LabStatus;
  mdLink: string;
  mdContent: string;
  sourceLink: string;
  // === Assignment + review workflow ===
  assignedMinionId?: string | null;
  assignedAt?: string | null;
  acceptedByMinionAt?: string | null;
  submittedAt?: string | null;
  acceptedAt?: string | null;
  review: LabReviewStage[];
  // === Comments (free-form chat) ===
  comments: LabComment[];
  createdAt: string;
  updatedAt: string;
}