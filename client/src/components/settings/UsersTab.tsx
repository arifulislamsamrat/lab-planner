import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { userApi } from '../../services/userApi';
import UserFormModal from './UserFormModal';
import ConfirmDialog from '../common/ConfirmDialog';
import Spinner from '../common/Spinner';
import { showToast, toastError } from '../common/Toast';
import { ROLE_LABELS, type User } from '../../types/domain';

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UsersTab() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['users'], queryFn: userApi.list });
  const create = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      showToast('User created');
    },
    onError: (e) => toastError(e),
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof userApi.update>[1] }) =>
      userApi.update(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      showToast('User updated');
    },
    onError: (e) => toastError(e),
  });
  const remove = useMutation({
    mutationFn: userApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      showToast('User disabled');
    },
    onError: (e) => toastError(e),
  });

  const [editing, setEditing] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  const [disabling, setDisabling] = useState<User | null>(null);

  if (isLoading) return <Spinner label="Loading users..." />;
  const users = data ?? [];

  return (
    <>
      <div className="toolbar">
        <div className="muted">{users.length} user(s)</div>
        <div className="toolbar-right">
          <button className="button primary" onClick={() => setCreating(true)}>+ New user</button>
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <h3>No users yet</h3>
          <p>Create your first user — pick from Admin, Course Coordinator, Instructor, or Minion.</p>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-row">
                      <span className={`user-avatar user-avatar-sm ${u.isActive ? '' : 'disabled'}`} aria-hidden="true">{initialsOf(u.name)}</span>
                      <span>{u.name}</span>
                    </div>
                  </td>
                  <td className="muted">{u.email}</td>
                  <td><span className={`role-pill ${u.role}`}>{ROLE_LABELS[u.role]}</span></td>
                  <td>
                    <span className={`status-pill ${u.isActive ? 'on' : 'off'}`}>
                      {u.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="course-actions">
                      <button className="chip" onClick={() => setEditing(u)}>
                        <span className="icon" aria-hidden="true">✏</span>
                        <span>Edit</span>
                      </button>
                      {u.isActive && (
                        <button className="chip danger-chip" onClick={() => setDisabling(u)}>
                          <span className="icon" aria-hidden="true">⊘</span>
                          <span>Disable</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <UserFormModal
        open={creating}
        onCancel={() => setCreating(false)}
        submitting={create.isPending}
        onSubmit={(payload) =>
          create.mutate(payload as Parameters<typeof userApi.create>[0], {
            onSuccess: () => setCreating(false),
          })
        }
      />

      <UserFormModal
        open={!!editing}
        initial={editing}
        onCancel={() => setEditing(null)}
        submitting={update.isPending}
        onSubmit={(payload) => {
          if (!editing) return;
          update.mutate(
            { id: editing.id, payload },
            { onSuccess: () => setEditing(null) },
          );
        }}
      />

      <ConfirmDialog
        open={!!disabling}
        title="Disable this user?"
        message={
          disabling ? (
            <span>
              <strong>{disabling.name}</strong> will no longer be able to sign in.
              You can re-enable them from the Edit dialog.
            </span>
          ) : null
        }
        danger
        confirmLabel="Disable"
        onCancel={() => setDisabling(null)}
        onConfirm={() => {
          if (disabling) remove.mutate(disabling.id, { onSuccess: () => setDisabling(null) });
        }}
      />
    </>
  );
}
