import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { shareApi, type ShareKind } from '../services/shareApi';

export const shareKeys = {
  all: ['shares'] as const,
  forRef: (kind: ShareKind, refId: string) => ['shares', kind, refId] as const,
};

export function useSharesForRef(kind: ShareKind, refId: string) {
  return useQuery({
    queryKey: shareKeys.forRef(kind, refId),
    queryFn: () => shareApi.list({ kind, refId }),
    enabled: !!refId,
  });
}

export function useCreateShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, refId }: { kind: ShareKind; refId: string }) =>
      shareApi.create(kind, refId),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: shareKeys.forRef(vars.kind, vars.refId) });
    },
  });
}

export function useRevokeShare() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shareApi.revoke(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: shareKeys.all });
    },
  });
}
