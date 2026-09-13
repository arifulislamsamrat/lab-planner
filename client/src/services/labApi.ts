import apiClient from './apiClient';
import type { Lab, LabComment, CoursePlanningTree } from '../types/domain';
import type { MyLabTab } from '../utils/constants';

export const labApi = {
  listByLabGroup: async (labGroupId: string): Promise<Lab[]> =>
    (await apiClient.get<{ data: Lab[] }>(`/lab-groups/${labGroupId}/labs`)).data.data,
  create: async (labGroupId: string, payload: Partial<Lab>): Promise<Lab> =>
    (await apiClient.post<{ data: Lab }>(`/lab-groups/${labGroupId}/labs`, payload)).data.data,
  get: async (id: string): Promise<Lab> => (await apiClient.get<{ data: Lab }>(`/labs/${id}`)).data.data,
  update: async (id: string, payload: Partial<Lab>): Promise<Lab> =>
    (await apiClient.put<{ data: Lab }>(`/labs/${id}`, payload)).data.data,
  remove: async (id: string): Promise<void> => { await apiClient.delete(`/labs/${id}`); },
  updateStatus: async (id: string, status: Lab['status']): Promise<Lab> =>
    (await apiClient.patch<{ data: Lab }>(`/labs/${id}/status`, { status })).data.data,
  addComment: async (id: string, body: string): Promise<LabComment> =>
    (await apiClient.post<{ data: LabComment }>(`/labs/${id}/comments`, { body })).data.data,
  removeComment: async (labId: string, commentId: string): Promise<void> => {
    await apiClient.delete(`/labs/${labId}/comments/${commentId}`);
  },
  reorder: async (labGroupId: string, items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.patch(`/lab-groups/${labGroupId}/labs/reorder`, { items });
  },
  reorderAcrossGroups: async (items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.patch(`/labs/reorder`, { items });
  },
  getPlanning: async (courseId: string): Promise<CoursePlanningTree> =>
    (await apiClient.get<{ data: CoursePlanningTree }>(`/courses/${courseId}/planning`)).data.data,
  getResource: async (labId: string): Promise<{ title: string; html: string; requestedUrl: string; fetchedUrl: string; source: 'link' | 'inline'; contentType: string }> =>
    (await apiClient.get<{ data: any }>(`/labs/${labId}/resource`)).data.data,

  // === Assignment + submission + review workflow ===
  assign: async (labId: string, minionId: string): Promise<Lab> =>
    (await apiClient.post<{ data: Lab }>(`/labs/${labId}/assign`, { minionId })).data.data,
  unassign: async (labId: string): Promise<Lab> =>
    (await apiClient.delete<{ data: Lab }>(`/labs/${labId}/assign`)).data.data,
  submit: async (labId: string): Promise<Lab> =>
    (await apiClient.post<{ data: Lab }>(`/labs/${labId}/submit`)).data.data,
  acceptAssignment: async (labId: string): Promise<Lab> =>
    (await apiClient.post<{ data: Lab }>(`/labs/${labId}/accept-assignment`)).data.data,
  declineAssignment: async (labId: string): Promise<Lab> =>
    (await apiClient.post<{ data: Lab }>(`/labs/${labId}/decline-assignment`)).data.data,
  openReview: async (labId: string, feedback: string): Promise<Lab> =>
    (await apiClient.post<{ data: Lab }>(`/labs/${labId}/review/open`, { feedback })).data.data,
  resolveReview: async (labId: string, stageId: string): Promise<Lab> =>
    (await apiClient.post<{ data: Lab }>(`/labs/${labId}/review/${stageId}/resolve`)).data.data,
  acceptLab: async (labId: string): Promise<Lab> =>
    (await apiClient.post<{ data: Lab }>(`/labs/${labId}/review/accept`)).data.data,
  listMyLabs: async (tab: MyLabTab = 'all'): Promise<Lab[]> =>
    (await apiClient.get<{ data: Lab[] }>(`/labs/my-labs?tab=${tab}`)).data.data,
};