import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { courseApi } from '../../services/courseApi';
import { showToast, toastError } from '../common/Toast';
import ConfirmDialog from '../common/ConfirmDialog';

export default function DangerZoneTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['courses'], queryFn: courseApi.list });
  const remove = useMutation({
    mutationFn: (id: string) => courseApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courses'] });
      showToast('Course deleted');
    },
    onError: (e) => toastError(e),
  });

  const [selectedId, setSelectedId] = useState<string>('');
  const [confirm, setConfirm] = useState(false);

  if (isLoading) return <p className="muted">Loading courses...</p>;
  const courses = data ?? [];

  return (
    <div className="danger-zone">
      <h3>Danger Zone</h3>
      <p className="muted">
        Deleting a course removes its milestones, modules, lab groups, and labs.
        This action cannot be undone.
      </p>
      <div className="field" style={{ marginTop: 16, maxWidth: 360 }}>
        <label>Course to delete</label>
        <select
          className="select"
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          <option value="">— Select a course —</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>
      <button
        className="button danger"
        disabled={!selectedId || remove.isPending}
        onClick={() => setConfirm(true)}
      >
        {remove.isPending ? 'Deleting…' : 'Delete course'}
      </button>

      <ConfirmDialog
        open={confirm}
        title="Delete this course?"
        message={
          <span>
            This will permanently delete the course and all of its milestones,
            modules, lab groups, and labs. <strong>This cannot be undone.</strong>
          </span>
        }
        danger
        confirmLabel="Delete"
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (!selectedId) return;
          remove.mutate(selectedId, { onSuccess: () => { setConfirm(false); setSelectedId(''); } });
        }}
      />
    </div>
  );
}
