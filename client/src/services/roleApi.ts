import apiClient from './apiClient';
import type { Role } from '../types/domain';

export interface RoleInfo {
  key: Role;
  label: string;
  description: string;
}

export const roleApi = {
  list: () => apiClient.get<{ data: RoleInfo[] }>('/roles').then((r) => r.data.data),
};
