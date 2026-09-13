import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import ActionMenu from '../common/ActionMenu';
import Modal from '../common/Modal';
import { userApi } from '../../services/userApi';
import {
  useAcceptAssignment,
  useAssignLab,
  useDeclineAssignment,
  useUnassignLab,
} from '../../hooks/useLab';
import { useAuth } from '../../hooks/useAuth';
import { LAB_STATUSES, LAB_STATUS_LABELS } from '../../utils/constants';
import type { Lab, User } from '../../types/domain';

interface Props {
  lab: Lab;
  onEdit: () => void;
  onDelete: () => void;
  onChangeStatus: (status: Lab['status']) => void;
  /** Whether the current user is allowed to assign this lab. */
  canAssign?: boolean;
}

function pickMinions(users: User[] | undefined): User[] {
  return (users ?? []).filter((u) => u.role === 'MINION' && u.isActive);
}

function AssignModal({
  lab,
  onClose,
}: {
  lab: Lab;
  onClose: () => void;
}) {
  const { data: users } = useQuery({ queryKey: ['users'], queryFn: userApi.list });
  const assign = useAssignLab();
  const unassign = useUnassignLab();
  const minions = pickMinions(users);
  const assignedId = lab.assignedMinionId ?? '';
  const assignedUser = (users ?? []).find((u) => u.id === assignedId);

  return (
    <Modal
      open
      title={assignedId ? 'Change assignment' : 'Assign to minion'}
      onClose={onClose}
      footer={
        <button type="button" className="button" onClick={onClose}>Done</button>
      }
    >
      <div className="field">
        <label htmlFor={`assign-modal-${lab._id}`}>Minion</label>
        <select
          id={`assign-modal-${lab._id}`}
          className="select"
          autoFocus
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
      </div>

      {!assignedId && minions.length === 0 && (
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          No active minions in the system yet — add one in Settings → Users first.
        </p>
      )}

      {assignedUser && (
        <p className="muted" style={{ fontSize: 13, marginTop: 12 }}>
          Currently assigned to <strong>{assignedUser.name}</strong>
          {lab.assignedAt && ` on ${new Date(lab.assignedAt).toLocaleString()}`}.
        </p>
      )}

      {assignedId && (
        <button
          type="button"
          className="button ghost small"
          style={{ marginTop: 12 }}
          onClick={() => unassign.mutate(lab._id)}
          disabled={unassign.isPending}
        >
          Unassign
        </button>
      )}
    </Modal>
  );
}

export default function LabRow({ lab, onEdit, onDelete, onChangeStatus, canAssign = false }: Props) {
  const [statusPickerOpen, setStatusPickerOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const { user } = useAuth();
  const acceptAssignment = useAcceptAssignment();
  const declineAssignment = useDeclineAssignment();

  const hasMdLink = !!(lab.mdLink && lab.mdLink.trim());
  const hasMdContent = !!(lab.mdContent && lab.mdContent.trim());
  const hasMdSource = hasMdLink || hasMdContent;
  const hasSourceLink = !!(lab.sourceLink && lab.sourceLink.trim());
  const hasAssignee = !!lab.assignedMinionId;

  // Is the current user the assigned minion and is the assignment not yet
  // accepted? Then show Accept/Decline buttons inline.
  const isAssigneeMinion =
    !!user &&
    user.role === 'MINION' &&
    !!lab.assignedMinionId &&
    String(lab.assignedMinionId) === String(user.id);
  const awaitingAcceptance =
    isAssigneeMinion && !lab.acceptedByMinionAt && lab.status !== 'DONE';

  function handleViewLab() {
    if (!hasMdSource) {
      window.alert('No MD link or pasted README set for this lab.');
      return;
    }
    // Just open the lab details page where the viewer is triggered.
    window.location.href = `/labs/${lab._id}`;
  }

  function handleSeeResource() {
    if (!hasSourceLink) {
      window.alert('No source link set for this lab.');
      return;
    }
    window.open(lab.sourceLink, '_blank', 'noopener,noreferrer');
  }

  const menuItems = [
    ...(canAssign
      ? [{
          label: hasAssignee ? 'Change assignment' : 'Assign to minion',
          icon: '👤',
          onClick: () => setAssignOpen(true),
        }]
      : []),
    ...(awaitingAcceptance
      ? [
          {
            label: 'Accept assignment',
            icon: '✅',
            onClick: () => acceptAssignment.mutate(lab._id),
            disabled: acceptAssignment.isPending,
          },
          {
            label: 'Decline assignment',
            icon: '↩️',
            onClick: () => {
              if (window.confirm('Decline this assignment?')) {
                declineAssignment.mutate(lab._id);
              }
            },
            disabled: declineAssignment.isPending,
            danger: true,
          },
        ]
      : []),
    {
      label: 'Set status',
      icon: '🔁',
      onClick: () => setStatusPickerOpen(true),
    },
    ...(hasMdSource
      ? [{ label: 'View lab', icon: '📄', onClick: handleViewLab }]
      : []),
    ...(hasSourceLink
      ? [{ label: 'Open source link', icon: '🔗', onClick: handleSeeResource }]
      : []),
    { label: 'Edit', icon: '✏️', onClick: onEdit },
    { label: 'Delete', icon: '🗑', danger: true, onClick: onDelete },
  ];

  return (
    <>
      <div className="lab-row">
        <div style={{ minWidth: 0, flex: 1 }}>
          <Link to={`/labs/${lab._id}`} className="lab-title">{lab.title}</Link>
          {lab.estimatedTime ? <span className="lab-meta"> · {lab.estimatedTime} min</span> : null}
          {hasAssignee && (
            <span className="lab-meta" style={{ marginLeft: 8, opacity: 0.75 }}>
              · 👤 assigned
            </span>
          )}
          {awaitingAcceptance && (
            <span
              className="lab-meta"
              style={{ marginLeft: 8, color: 'var(--color-warning, #d97706)', fontWeight: 600 }}
              title="This assignment is awaiting your acceptance"
            >
              · ⏳ awaiting acceptance
            </span>
          )}
        </div>
        <div className="lab-row-actions">
          {awaitingAcceptance && (
            <button
              type="button"
              className="chip primary"
              disabled={acceptAssignment.isPending}
              onClick={() => acceptAssignment.mutate(lab._id)}
              title="Accept this assignment"
            >
              <span className="icon" aria-hidden="true">✅</span>
              <span>{acceptAssignment.isPending ? 'Accepting…' : 'Accept'}</span>
            </button>
          )}
          <button
            type="button"
            className="chip"
            onClick={onEdit}
            title="Edit this lab"
          >
            <span className="icon" aria-hidden="true">✏️</span>
            <span>Edit lab</span>
          </button>
          <button
            type="button"
            className={`chip ${hasMdSource ? 'primary' : ''}`}
            onClick={handleViewLab}
            title={hasMdSource ? 'Open the MD resource viewer' : 'No MD link or pasted README set'}
          >
            <span className="icon" aria-hidden="true">👁️</span>
            <span>View lab</span>
          </button>
          <StatusBadge status={lab.status} />
          <ActionMenu items={menuItems} />
        </div>
      </div>

      <Modal
        open={statusPickerOpen}
        title="Set status"
        onClose={() => setStatusPickerOpen(false)}
      >
        <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {LAB_STATUSES.map((s) => (
            <button
              key={s}
              type="button"
              className={`button ${lab.status === s ? 'primary' : ''}`}
              onClick={() => {
                if (lab.status !== s) onChangeStatus(s);
                setStatusPickerOpen(false);
              }}
            >
              {LAB_STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </Modal>

      {assignOpen && (
        <AssignModal
          lab={lab}
          onClose={() => setAssignOpen(false)}
        />
      )}
    </>
  );
}
