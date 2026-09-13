import { useState } from 'react';
import ActionMenu from '../common/ActionMenu';
import LabGroupItem from './LabGroupItem';
import LabGroupForm from './LabGroupForm';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import {
  useCreateLabGroup,
  useDeleteLabGroup,
  useUpdateLabGroup,
  useReorderLabGroups,
} from '../../hooks/usePlanningMutations';
import type { LabGroup, ModuleEntity, Lab } from '../../types/domain';

interface Props {
  courseId: string;
  moduleEntity: ModuleEntity & { labGroups: Array<LabGroup & { labs: Lab[] }> };
  onEdit: () => void;
  onDelete: () => void;
}

export default function ModuleItem({ courseId, moduleEntity, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingGroup, setEditingGroup] = useState<LabGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<(LabGroup & { labs?: Lab[] }) | null>(null);
  const createGroup = useCreateLabGroup(courseId);
  const updateGroup = useUpdateLabGroup(courseId);
  const deleteGroup = useDeleteLabGroup(courseId);
  const reorder = useReorderLabGroups(courseId);

  function moveGroup(g: LabGroup, dir: -1 | 1) {
    const idx = moduleEntity.labGroups.findIndex((x) => x._id === g._id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= moduleEntity.labGroups.length) return;
    const next = [...moduleEntity.labGroups];
    const [moved] = next.splice(idx, 1);
    next.splice(newIdx, 0, moved);
    reorder.mutate({
      moduleId: moduleEntity._id,
      items: next.map((x, i) => ({ id: x._id, order: i })),
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
          <div className="title">{moduleEntity.title}</div>
          {moduleEntity.description && <div className="meta">{moduleEntity.description}</div>}
        </div>
        <span className="meta">{moduleEntity.labGroups.length} group(s)</span>
        <div className="actions">
          <button className="button" onClick={() => setCreating(true)}>+ Lab Group</button>
          <ActionMenu
            items={[
              { label: 'Edit', onClick: onEdit },
              { label: 'Add Lab Group', onClick: () => setCreating(true) },
              { label: 'Delete', onClick: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
      {open && (
        <div className="tree-node-body">
          {moduleEntity.labGroups.length === 0 ? (
            <EmptyState
              title="No lab groups yet"
              description="Group related labs under this module."
              action={<button className="button primary" onClick={() => setCreating(true)}>+ Add Lab Group</button>}
            />
          ) : (
            <div className="tree-children indent">
              {moduleEntity.labGroups.map((g, idx) => (
                <div key={g._id}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <LabGroupItem
                        courseId={courseId}
                        labGroup={g}
                        onEdit={() => setEditingGroup(g)}
                        onDelete={() => setDeletingGroup(g)}
                      />
                    </div>
                    <div className="row" style={{ gap: 4, alignItems: 'flex-start', paddingTop: 12 }}>
                      <button className="button ghost icon" disabled={idx === 0} onClick={() => moveGroup(g, -1)} title="Move up">↑</button>
                      <button className="button ghost icon" disabled={idx === moduleEntity.labGroups.length - 1} onClick={() => moveGroup(g, 1)} title="Move down">↓</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={creating} title="Create Lab Group" onClose={() => setCreating(false)}>
        <LabGroupForm
          onSubmit={(payload) =>
            createGroup.mutate({ moduleId: moduleEntity._id, payload }, {
              onSuccess: () => setCreating(false),
            })
          }
          onCancel={() => setCreating(false)}
          submitting={createGroup.isPending}
        />
      </Modal>

      <Modal open={!!editingGroup} title="Edit Lab Group" onClose={() => setEditingGroup(null)}>
        {editingGroup && (
          <LabGroupForm
            initial={editingGroup}
            onSubmit={(payload) =>
              updateGroup.mutate({ id: editingGroup._id, payload }, {
                onSuccess: () => setEditingGroup(null),
              })
            }
            onCancel={() => setEditingGroup(null)}
            submitting={updateGroup.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingGroup}
        title="Delete Lab Group?"
        message={
          deletingGroup ? (
            <span>
              {(deletingGroup.labs?.length ?? 0) > 0 ? (
                <>
                  This lab group contains <strong>{deletingGroup.labs?.length ?? 0}</strong> lab(s). Please delete them first.
                </>
              ) : (
                <>Are you sure you want to delete <strong>{deletingGroup.title}</strong>?</>
              )}
            </span>
          ) : null
        }
        danger
        confirmLabel="Delete"
        onCancel={() => setDeletingGroup(null)}
        onConfirm={() => {
          if (deletingGroup) deleteGroup.mutate(deletingGroup._id, {
            onSuccess: () => setDeletingGroup(null),
            onError: () => setDeletingGroup(null),
          });
        }}
      />
    </div>
  );
}