import { useQuery } from '@tanstack/react-query';
import { userApi } from '../../services/userApi';
import { useAssignLab, useUnassignLab } from '../../hooks/useLab';
import type { Lab, User } from '../../types/domain';

interface Props {
  lab: Lab;
  canManage: boolean;
}

function pickMinions(users: User[] | undefined): User[] {
  return (users ?? []).filter((u) => u.role === 'MINION' && u.isActive);
}

export default function AssignmentPicker({ lab, canManage }: Props) {
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userApi.list });
  const assign = useAssignLab();
  const unassign = useUnassignLab();
  const minions = pickMinions(users);

  const assignedId = lab.assignedMinionId ?? '';
  const assignedUser = (users ?? []).find((u) => u.id === assignedId);

  if (!canManage) {
    return (
      <div className="assignment-picker assignment-picker--readonly">
        <span className="assignment-picker__label">Assigned to</span>
        <span className="assignment-picker__value">
          {assignedUser ? assignedUser.name : <span className="muted">Unassigned</span>}
        </span>
      </div>
    );
  }

  return (
    <div className={`assignment-picker ${assignedId ? '' : 'assignment-picker--empty'}`}>
      <div className="assignment-picker__head">
        <label className="assignment-picker__label" htmlFor={`assign-${lab._id}`}>
          Assigned to
        </label>
        {!assignedId && (
          <span className="assignment-picker__pill">Unassigned</span>
        )}
      </div>
      <div className="assignment-picker__row">
        <select
          id={`assign-${lab._id}`}
          className="select"
          value={assignedId}
          onChange={(ev) => {
            const v = ev.target.value;
            if (!v) {
              unassign.mutate(lab._id);
            } else {
              assign.mutate({ labId: lab._id, minionId: v });
            }
          }}
          disabled={assign.isPending || unassign.isPending}
        >
          <option value="">— Unassigned —</option>
          {minions.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} · {u.email}
            </option>
          ))}
        </select>
        {assignedId && (
          <button
            type="button"
            className="button ghost small"
            onClick={() => unassign.mutate(lab._id)}
            disabled={unassign.isPending}
          >
            Unassign
          </button>
        )}
      </div>
      {!assignedId && minions.length === 0 && (
        <span className="assignment-picker__hint muted">
          No active minions in the system yet — add one in Users first.
        </span>
      )}
      {!assignedId && minions.length > 0 && (
        <span className="assignment-picker__hint">
          Pick a minion from the dropdown, or use the <strong>Assign</strong> button in the header.
        </span>
      )}
      {lab.assignedAt && (
        <span className="assignment-picker__hint muted">
          Assigned {new Date(lab.assignedAt).toLocaleString()}
        </span>
      )}
    </div>
  );
}
