import apiClient from './apiClient';
import type { Course } from '../types/domain';

export const courseApi = {
  list: async (): Promise<Course[]> => (await apiClient.get<{ data: Course[] }>('/courses')).data.data,
  get: async (id: string): Promise<Course> => (await apiClient.get<{ data: Course }>(`/courses/${id}`)).data.data,
  create: async (payload: Partial<Course>): Promise<Course> =>
    (await apiClient.post<{ data: Course }>('/courses', payload)).data.data,
  update: async (id: string, payload: Partial<Course>): Promise<Course> =>
    (await apiClient.put<{ data: Course }>(`/courses/${id}`, payload)).data.data,
  remove: async (id: string): Promise<void> => { await apiClient.delete(`/courses/${id}`); },
};