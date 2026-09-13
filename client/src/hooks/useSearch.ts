import { useQuery } from '@tanstack/react-query';
import { searchApi, type SearchResults } from '../services/searchApi';
import { useAuth } from './useAuth';
import { useDebounce } from './useDebounce';

export function useSearch(rawQuery: string, limit = 8) {
  const { user } = useAuth();
  const trimmed = rawQuery.trim();
  // Debounce the input so we don't fire a request on every keystroke.
  const debounced = useDebounce(trimmed, 250);

  return useQuery<SearchResults>({
    // Re-fetches when the debounced value changes; identity-bound to the user
    // so cache is per-user.
    queryKey: ['search', user?.id ?? '__none__', debounced, limit],
    queryFn: () => searchApi.global(debounced, limit),
    // Only fetch when we have something to search AND a logged-in user.
    enabled: !!user && debounced.length > 0,
    // Don't keep stale results around across queries.
    staleTime: 30_000,
  });
}
