import { useState } from 'react';
import ActionMenu from '../common/ActionMenu';
import ModuleItem from './ModuleItem';
import ModuleForm from './ModuleForm';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import {
  useCreateModule,
  useDeleteModule,
  useUpdateModule,
  useReorderModules,
} from '../../hooks/usePlanningMutations';
import type { Milestone, ModuleEntity, LabGroup, Lab } from '../../types/domain';

type ModuleWithChildren = ModuleEntity & {
  labGroups: Array<LabGroup & { labs: Lab[] }>;
};

interface Props {
  courseId: string;
  milestone: Milestone & { modules: ModuleWithChildren[] };
  onEdit: () => void;
  onDelete: () => void;
}

export default function MilestoneItem({ courseId, milestone, onEdit, onDelete }: Props) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingModule, setEditingModule] = useState<ModuleWithChildren | null>(null);
  const [deletingModule, setDeletingModule] = useState<ModuleWithChildren | null>(null);
  const createModule = useCreateModule(courseId);
  const updateModule = useUpdateModule(courseId);
  const deleteModule = useDeleteModule(courseId);
  const reorder = useReorderModules(courseId);

  function moveModule(m: ModuleWithChildren, dir: -1 | 1) {
    const idx = milestone.modules.findIndex((x) => x._id === m._id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= milestone.modules.length) return;
    const next = [...milestone.modules];
    const [moved] = next.splice(idx, 1);
    next.splice(newIdx, 0, moved);
    reorder.mutate({
      milestoneId: milestone._id,
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
          <div className="title">{milestone.title}</div>
          {milestone.description && <div className="meta">{milestone.description}</div>}
        </div>
        <span className="meta">{milestone.modules.length} module(s)</span>
        <div className="actions">
          <button className="button" onClick={() => setCreating(true)}>+ Module</button>
          <ActionMenu
            items={[
              { label: 'Edit', onClick: onEdit },
              { label: 'Add Module', onClick: () => setCreating(true) },
              { label: 'Delete', onClick: onDelete, danger: true },
            ]}
          />
        </div>
      </div>
      {open && (
        <div className="tree-node-body">
          {milestone.modules.length === 0 ? (
            <EmptyState
              title="No modules yet"
              description="Add the first module to this milestone."
              action={<button className="button primary" onClick={() => setCreating(true)}>+ Add Module</button>}
            />
          ) : (
            <div className="tree-children indent">
              {milestone.modules.map((m, idx) => (
                <div key={m._id}>
                  <div className="row" style={{ marginBottom: 4 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <ModuleItem
                        courseId={courseId}
                        moduleEntity={m}
                        onEdit={() => setEditingModule(m)}
                        onDelete={() => setDeletingModule(m)}
                      />
                    </div>
                    <div className="row" style={{ gap: 4, alignItems: 'flex-start', paddingTop: 12 }}>
                      <button className="button ghost icon" disabled={idx === 0} onClick={() => moveModule(m, -1)} title="Move up">↑</button>
                      <button className="button ghost icon" disabled={idx === milestone.modules.length - 1} onClick={() => moveModule(m, 1)} title="Move down">↓</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={creating} title="Create Module" onClose={() => setCreating(false)}>
        <ModuleForm
          onSubmit={(payload) =>
            createModule.mutate({ milestoneId: milestone._id, payload }, {
              onSuccess: () => setCreating(false),
            })
          }
          onCancel={() => setCreating(false)}
          submitting={createModule.isPending}
        />
      </Modal>

      <Modal open={!!editingModule} title="Edit Module" onClose={() => setEditingModule(null)}>
        {editingModule && (
          <ModuleForm
            initial={editingModule}
            onSubmit={(payload) =>
              updateModule.mutate({ id: editingModule._id, payload }, {
                onSuccess: () => setEditingModule(null),
              })
            }
            onCancel={() => setEditingModule(null)}
            submitting={updateModule.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deletingModule}
        title="Delete Module?"
        message={
          deletingModule ? (
            <span>
              {deletingModule.labGroups.length > 0 ? (
                <>
                  This module contains <strong>{deletingModule.labGroups.length}</strong> lab group(s).
                  Please delete them first.
                </>
              ) : (
                <>Are you sure you want to delete <strong>{deletingModule.title}</strong>?</>
              )}
            </span>
          ) : null
        }
        danger
        confirmLabel="Delete"
        onCancel={() => setDeletingModule(null)}
        onConfirm={() => {
          if (deletingModule) deleteModule.mutate(deletingModule._id, {
            onSuccess: () => setDeletingModule(null),
            onError: () => setDeletingModule(null),
          });
        }}
      />
    </div>
  );
}