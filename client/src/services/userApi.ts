import apiClient from './apiClient';
import type { User } from '../types/domain';

export const userApi = {
  list: () => apiClient.get<{ data: User[] }>('/users').then((r) => r.data.data),
  create: (payload: { name: string; email: string; password: string; role: User['role']; isActive?: boolean }) =>
    apiClient.post<{ data: User }>('/users', payload).then((r) => r.data.data),
  update: (id: string, payload: Partial<{ name: string; email: string; password: string; role: User['role']; isActive: boolean }>) =>
    apiClient.patch<{ data: User }>(`/users/${id}`, payload).then((r) => r.data.data),
  remove: (id: string) => apiClient.delete(`/users/${id}`),
};
