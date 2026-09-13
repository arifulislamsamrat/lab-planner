import apiClient from './apiClient';
import type { LabGroup } from '../types/domain';

export const labGroupApi = {
  listByModule: async (moduleId: string): Promise<LabGroup[]> =>
    (await apiClient.get<{ data: LabGroup[] }>(`/modules/${moduleId}/lab-groups`)).data.data,
  create: async (moduleId: string, payload: Partial<LabGroup>): Promise<LabGroup> =>
    (await apiClient.post<{ data: LabGroup }>(`/modules/${moduleId}/lab-groups`, payload)).data.data,
  update: async (id: string, payload: Partial<LabGroup>): Promise<LabGroup> =>
    (await apiClient.put<{ data: LabGroup }>(`/lab-groups/${id}`, payload)).data.data,
  remove: async (id: string): Promise<void> => { await apiClient.delete(`/lab-groups/${id}`); },
  reorder: async (moduleId: string, items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.patch(`/modules/${moduleId}/lab-groups/reorder`, { items });
  },
};