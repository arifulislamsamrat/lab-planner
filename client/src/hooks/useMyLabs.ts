import { useQuery } from '@tanstack/react-query';
import { labApi } from '../services/labApi';
import { useAuth } from './useAuth';
import type { MyLabTab } from '../utils/constants';

export function useMyLabs(tab: MyLabTab = 'all') {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-labs', user?.id ?? '__none__', tab],
    queryFn: () => labApi.listMyLabs(tab),
    enabled: !!user,
  });
}
