import { useMutation, useQueryClient } from '@tanstack/react-query';
import { milestoneApi } from '../services/milestoneApi';
import { moduleApi } from '../services/moduleApi';
import { labGroupApi } from '../services/labGroupApi';
import { labApi } from '../services/labApi';
import { planningKeys } from './useCoursePlanning';
import { showToast, toastError } from '../components/common/Toast';
import type { Milestone, ModuleEntity, LabGroup, Lab } from '../types/domain';

function invalidateCourse(qc: ReturnType<typeof useQueryClient>, courseId: string) {
  qc.invalidateQueries({ queryKey: planningKeys.byCourse(courseId) });
}

export function useCreateMilestone(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<Milestone>) => milestoneApi.create(courseId, payload),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Milestone created'); },
    onError: (e) => toastError(e),
  });
}
export function useUpdateMilestone(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Milestone> }) =>
      milestoneApi.update(id, payload),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Milestone updated'); },
    onError: (e) => toastError(e),
  });
}
export function useDeleteMilestone(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => milestoneApi.remove(id),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Milestone deleted'); },
    onError: (e) => toastError(e),
  });
}
export function useReorderMilestones(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ id: string; order: number }>) => milestoneApi.reorder(courseId, items),
    onSuccess: () => invalidateCourse(qc, courseId),
    onError: (e) => toastError(e),
  });
}

export function useCreateModule(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, payload }: { milestoneId: string; payload: Partial<ModuleEntity> }) =>
      moduleApi.create(milestoneId, payload),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Module created'); },
    onError: (e) => toastError(e),
  });
}
export function useUpdateModule(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ModuleEntity> }) =>
      moduleApi.update(id, payload),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Module updated'); },
    onError: (e) => toastError(e),
  });
}
export function useDeleteModule(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => moduleApi.remove(id),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Module deleted'); },
    onError: (e) => toastError(e),
  });
}
export function useReorderModules(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ milestoneId, items }: { milestoneId: string; items: Array<{ id: string; order: number }> }) =>
      moduleApi.reorder(milestoneId, items),
    onSuccess: () => invalidateCourse(qc, courseId),
    onError: (e) => toastError(e),
  });
}

export function useCreateLabGroup(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, payload }: { moduleId: string; payload: Partial<LabGroup> }) =>
      labGroupApi.create(moduleId, payload),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Lab group created'); },
    onError: (e) => toastError(e),
  });
}
export function useUpdateLabGroup(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<LabGroup> }) =>
      labGroupApi.update(id, payload),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Lab group updated'); },
    onError: (e) => toastError(e),
  });
}
export function useDeleteLabGroup(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labGroupApi.remove(id),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Lab group deleted'); },
    onError: (e) => toastError(e),
  });
}
export function useReorderLabGroups(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ moduleId, items }: { moduleId: string; items: Array<{ id: string; order: number }> }) =>
      labGroupApi.reorder(moduleId, items),
    onSuccess: () => invalidateCourse(qc, courseId),
    onError: (e) => toastError(e),
  });
}

export function useCreateLab(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ labGroupId, payload }: { labGroupId: string; payload: Partial<Lab> }) =>
      labApi.create(labGroupId, payload),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Lab created'); },
    onError: (e) => toastError(e),
  });
}
export function useUpdateLab(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Lab> }) =>
      labApi.update(id, payload),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Lab updated'); },
    onError: (e) => toastError(e),
  });
}
export function useDeleteLab(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labApi.remove(id),
    onSuccess: () => { invalidateCourse(qc, courseId); showToast('Lab deleted'); },
    onError: (e) => toastError(e),
  });
}
export function useUpdateLabStatus(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Lab['status'] }) =>
      labApi.updateStatus(id, status),
    onSuccess: () => invalidateCourse(qc, courseId),
    onError: (e) => toastError(e),
  });
}
export function useReorderLabs(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ labGroupId, items }: { labGroupId: string; items: Array<{ id: string; order: number }> }) =>
      labApi.reorder(labGroupId, items),
    onSuccess: () => invalidateCourse(qc, courseId),
    onError: (e) => toastError(e),
  });
}
export function useReorderLabsAcross(courseId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (items: Array<{ id: string; order: number }>) => labApi.reorderAcrossGroups(items),
    onSuccess: () => invalidateCourse(qc, courseId),
    onError: (e) => toastError(e),
  });
}