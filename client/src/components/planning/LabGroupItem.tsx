import { useState } from 'react';
import ActionMenu from '../common/ActionMenu';
import LabRow from './LabRow';
import LabForm from './LabForm';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { ASSIGNMENT_ROLES } from '../../utils/constants';
import {
  useCreateLab,
  useDeleteLab,
  useUpdateLab,
  useReorderLabs,
} from '../../hooks/usePlanningMutations';
import type { Lab, LabGroup } from '../../types/domain';

interface Props {
  courseId: string;
  labGroup: LabGroup & { labs: Lab[] };
  onEdit: () => void;
  onDelete: () => void;
}

export default function LabGroupItem({ courseId, labGroup, onEdit, onDelete }: Props) {
  const { user } = useAuth();
  const canAssign = !!user && ASSIGNMENT_ROLES.includes(user.role as never);
  // Auto-expand on phones (<640px) so the user doesn't have to tap each level.
  const [open, setOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 640;
  });
  const [creating, setCreating] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const [deletingLab, setDeletingLab] = useState<Lab | null>(null);
  const createLab = useCreateLab(courseId);
  const updateLab = useUpdateLab(courseId);
  const deleteLab = useDeleteLab(courseId);
  const reorderLabs = useReorderLabs(courseId);

  function moveLab(lab: Lab, dir: -1 | 1) {
    const idx = labGroup.labs.findIndex((l) => l._id === lab._id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= labGroup.labs.length) return;
    const newLabs = [...labGroup.labs];
    const [moved] = newLabs.splice(idx, 1);
    newLabs.splice(newIdx, 0, moved);
    reorderLabs.mutate({
      labGroupId: labGroup._id,
      items: newLabs.map((l, i) => ({ id: l._id, order: i })),
    });
  }

  return (
    <div className="tree-node">
      <div className="tree-node-header">
        <button
          className="button ghost icon"
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? 'Collapse' : 'Expand'}
        >
          {open ? '▼' : '▶'}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="title">{labGroup.title}</div>
          {labGroup.description && <div className="meta">{labGroup.description}</div>}
        </div>
        <span className="meta">{labGroup.labs.length} lab(s)</span>
        <div className="actions">
          <button className="button" onClick={() => setCreating(true)}>+ Lab</button>
          <ActionMenu
            items={[
              { label: 'Edit', onClick: onEdit },
              { label: 'Add Lab', onClick: () => setCreating(true) },
              { label: 'Delete', onClick: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
      {open && (
        <div className="tree-node-body">
          {labGroup.labs.length === 0 ? (
            <EmptyState
              title="No labs yet"
              description="Add the first lab to this group."
              action={<button className="button primary" onClick={() => setCreating(true)}>+ Add Lab</button>}
            />
          ) : (
            labGroup.labs.map((lab, idx) => (
              <div key={lab._id} className="row" style={{ marginBottom: 4 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <LabRow
                    lab={lab}
                    onEdit={() => setEditingLab(lab)}
                    onDelete={() => setDeletingLab(lab)}
                    onChangeStatus={(status) =>
                      updateLab.mutate({ id: lab._id, payload: { status } })
                    }
                    canAssign={canAssign}
                  />
                </div>
                <div className="row" style={{ gap: 4 }}>
                  <ActionMenu
                    label="Reorder lab"
                    align="right"
                    items={[
                      { label: 'Move up', icon: '↑', onClick: () => moveLab(lab, -1), disabled: idx === 0 },
                      { label: 'Move down', icon: '↓', onClick: () => moveLab(lab, 1), disabled: idx === labGroup.labs.length - 1 },
                    ]}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <Modal open={creating} title="Create Lab" onClose={() => setCreating(false)} wide>
        <LabForm
          onSubmit={(payload) =>
            createLab.mutate({ labGroupId: labGroup._id, payload }, {
              onSuccess: () => setCreating(false),
            })
          }
          onCancel={() => setCreating(false)}
          submitting={createLab.isPending}
        />
      </Modal>

      <Modal open={!!editingLab} title="Edit Lab" onClose={() => setEditingLab(null)} wide>
        {editingLab && (
          <LabForm
            initial={editingLab}
            onSubmit={(payload) =>
              updateLab.mutate({ id: editingLab._id, payload }, {
                onSuccess: () => setEditingLab(null),
              })
            }
            onCancel={() => setEditingLab(null)}
            submitting={updateLab.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingLab}
        title="Delete Lab?"
        message={
          deletingLab ? (
            <span>
              Are you sure you want to delete <strong>{deletingLab.title}</strong>?
            </span>
          ) : null
        }
        danger
        confirmLabel="Delete"
        onCancel={() => setDeletingLab(null)}
        onConfirm={() => {
          if (deletingLab) deleteLab.mutate(deletingLab._id, {
            onSuccess: () => setDeletingLab(null),
          });
        }}
      />
    </div>
  );
}