import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labApi } from '../services/labApi';
import { showToast, toastError } from '../components/common/Toast';
import type { Lab } from '../types/domain';

export const labKeys = {
  all: ['labs'] as const,
  byId: (id: string | undefined) => ['lab', id ?? '__none__'] as const,
  myLabs: (userId: string | undefined, tab: string) => ['my-labs', userId ?? '__none__', tab] as const,
};

function invalidateLabQueries(qc: ReturnType<typeof useQueryClient>, labId: string) {
  qc.invalidateQueries({ queryKey: labKeys.byId(labId) });
  qc.invalidateQueries({ queryKey: labKeys.all });
  qc.invalidateQueries({ queryKey: ['my-labs'] });
  qc.invalidateQueries({ queryKey: ['planning'] });
}

export function useLab(id: string | undefined) {
  return useQuery({
    queryKey: labKeys.byId(id),
    queryFn: () => labApi.get(id as string),
    enabled: !!id,
  });
}

export function useUpdateLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Lab> }) =>
      labApi.update(id, payload),
    onSuccess: (lab) => {
      invalidateLabQueries(qc, lab._id);
      showToast('Lab updated');
    },
    onError: (e) => toastError(e),
  });
}

export function useUpdateLabStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lab['status'] }) =>
      labApi.updateStatus(id, status),
    onSuccess: (lab) => {
      invalidateLabQueries(qc, lab._id);
    },
    onError: (e) => toastError(e),
  });
}

export function useDeleteLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labApi.remove(id),
    onSuccess: (_data, id) => {
      invalidateLabQueries(qc, id);
      showToast('Lab deleted');
    },
    onError: (e) => toastError(e),
  });
}

// === Assignment + submission + review mutations ===

export function useAssignLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ labId, minionId }: { labId: string; minionId: string }) =>
      labApi.assign(labId, minionId),
    onSuccess: (lab) => invalidateLabQueries(qc, lab._id),
    onError: (e) => toastError(e),
  });
}

export function useUnassignLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labId: string) => labApi.unassign(labId),
    onSuccess: (lab) => invalidateLabQueries(qc, lab._id),
    onError: (e) => toastError(e),
  });
}

export function useSubmitLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labId: string) => labApi.submit(labId),
    onSuccess: (lab) => {
      invalidateLabQueries(qc, lab._id);
      showToast('Submitted for review');
    },
    onError: (e) => toastError(e),
  });
}

export function useAcceptAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labId: string) => labApi.acceptAssignment(labId),
    onSuccess: (lab) => {
      invalidateLabQueries(qc, lab._id);
      showToast('Assignment accepted');
    },
    onError: (e) => toastError(e),
  });
}

export function useDeclineAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labId: string) => labApi.declineAssignment(labId),
    onSuccess: (lab) => {
      invalidateLabQueries(qc, lab._id);
      showToast('Assignment declined — coordinator will be notified');
    },
    onError: (e) => toastError(e),
  });
}

export function useOpenReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ labId, feedback }: { labId: string; feedback: string }) =>
      labApi.openReview(labId, feedback),
    onSuccess: (lab) => invalidateLabQueries(qc, lab._id),
    onError: (e) => toastError(e),
  });
}

export function useResolveReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ labId, stageId }: { labId: string; stageId: string }) =>
      labApi.resolveReview(labId, stageId),
    onSuccess: (lab) => invalidateLabQueries(qc, lab._id),
    onError: (e) => toastError(e),
  });
}

export function useAcceptLab() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (labId: string) => labApi.acceptLab(labId),
    onSuccess: (lab) => {
      invalidateLabQueries(qc, lab._id);
      showToast('Lab accepted — marked as Done');
    },
    onError: (e) => toastError(e),
  });
}