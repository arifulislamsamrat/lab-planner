import { useQuery } from '@tanstack/react-query';
import { shareApi } from '../services/shareApi';

export function usePublicReadme(token: string) {
  return useQuery({
    queryKey: ['public-readme', token],
    queryFn: () => shareApi.publicReadme(token),
    enabled: !!token,
    retry: false,
  });
}

export function usePublicRoadmap(token: string) {
  return useQuery({
    queryKey: ['public-roadmap', token],
    queryFn: () => shareApi.publicRoadmap(token),
    enabled: !!token,
    retry: false,
  });
}
