import apiClient from './apiClient';
import type { ModuleEntity } from '../types/domain';

export const moduleApi = {
  listByMilestone: async (milestoneId: string): Promise<ModuleEntity[]> =>
    (await apiClient.get<{ data: ModuleEntity[] }>(`/milestones/${milestoneId}/modules`)).data.data,
  create: async (milestoneId: string, payload: Partial<ModuleEntity>): Promise<ModuleEntity> =>
    (await apiClient.post<{ data: ModuleEntity }>(`/milestones/${milestoneId}/modules`, payload)).data.data,
  update: async (id: string, payload: Partial<ModuleEntity>): Promise<ModuleEntity> =>
    (await apiClient.put<{ data: ModuleEntity }>(`/modules/${id}`, payload)).data.data,
  remove: async (id: string): Promise<void> => { await apiClient.delete(`/modules/${id}`); },
  reorder: async (milestoneId: string, items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.patch(`/milestones/${milestoneId}/modules/reorder`, { items });
  },
};