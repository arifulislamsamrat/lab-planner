import { useQuery } from '@tanstack/react-query';
import { labApi } from '../services/labApi';

export const planningKeys = {
  byCourse: (courseId: string) => ['planning', courseId] as const,
};

export function useCoursePlanning(courseId: string | undefined) {
  return useQuery({
    queryKey: courseId ? planningKeys.byCourse(courseId) : ['planning', 'none'],
    queryFn: () => labApi.getPlanning(courseId as string),
    enabled: !!courseId,
  });
}