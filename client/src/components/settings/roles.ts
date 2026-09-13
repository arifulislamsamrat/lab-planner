import type { Role } from '../../types/domain';

// Mirror of server-side constants. The server is the source of truth at runtime;
// this is just for UI enums.
export const ROLES_CLIENT: Role[] = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR', 'MINION'];
