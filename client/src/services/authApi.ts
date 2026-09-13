import apiClient from './apiClient';
import type { AuthResponse, AuthStatus } from '../types/domain';

export const authApi = {
  status: () => apiClient.get<{ data: AuthStatus }>('/auth/status').then((r) => r.data.data),
  bootstrap: (payload: { name: string; email: string; password: string }) =>
    apiClient.post<{ data: AuthResponse }>('/auth/bootstrap', payload).then((r) => r.data.data),
  login: (payload: { email: string; password: string }) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', payload).then((r) => r.data.data),
  me: () => apiClient.get<{ data: AuthResponse['user'] }>('/auth/me').then((r) => r.data.data),
};
