import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../services/courseApi';
import { toastError, showToast } from '../components/common/Toast';
import type { Course } from '../types/domain';

const KEYS = {
  all: ['courses'] as const,
  byId: (id: string) => ['courses', id] as const,
};

export function useCourses() {
  return useQuery({ queryKey: KEYS.all, queryFn: courseApi.list });
}

export function useCourse(id: string | undefined) {
  return useQuery({
    queryKey: id ? KEYS.byId(id) : ['courses', 'none'],
    queryFn: () => courseApi.get(id as string),
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Course>) => courseApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('Course created');
    },
    onError: (e) => toastError(e),
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Course> }) =>
      courseApi.update(id, payload),
    onSuccess: (course) => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      qc.invalidateQueries({ queryKey: KEYS.byId(course._id) });
      showToast('Course updated');
    },
    onError: (e) => toastError(e),
  });
}

export function useDeleteCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => courseApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.all });
      showToast('Course deleted');
    },
    onError: (e) => toastError(e),
  });
}

export const courseKeys = KEYS;