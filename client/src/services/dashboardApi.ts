import apiClient from './apiClient';
import type { DashboardSummary } from '../types/domain';

export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> =>
    (await apiClient.get<{ data: DashboardSummary }>('/dashboard/summary')).data.data,
};