import apiClient from './apiClient';
import type { Milestone } from '../types/domain';

export const milestoneApi = {
  listByCourse: async (courseId: string): Promise<Milestone[]> =>
    (await apiClient.get<{ data: Milestone[] }>(`/courses/${courseId}/milestones`)).data.data,
  create: async (courseId: string, payload: Partial<Milestone>): Promise<Milestone> =>
    (await apiClient.post<{ data: Milestone }>(`/courses/${courseId}/milestones`, payload)).data.data,
  update: async (id: string, payload: Partial<Milestone>): Promise<Milestone> =>
    (await apiClient.put<{ data: Milestone }>(`/milestones/${id}`, payload)).data.data,
  remove: async (id: string): Promise<void> => { await apiClient.delete(`/milestones/${id}`); },
  reorder: async (courseId: string, items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.patch(`/courses/${courseId}/milestones/reorder`, { items });
  },
};