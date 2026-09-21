import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCourse } from '../hooks/useCourses';
import { useCoursePlanning } from '../hooks/useCoursePlanning';
import {
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useReorderMilestones,
} from '../hooks/usePlanningMutations';
import MilestoneItem from '../components/planning/MilestoneItem';
import MilestoneForm from '../components/planning/MilestoneForm';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import EmptyState from '../components/common/EmptyState';
import Breadcrumb from '../components/common/Breadcrumb';
import { Skeleton, SkeletonPageHeader, SkeletonLines } from '../components/common/Skeleton';
import KanbanBoard from '../components/kanban/KanbanBoard';
import ActionMenu from '../components/common/ActionMenu';

type View = 'hierarchy' | 'board';

export default function LabPlanningPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { data: course } = useCourse(courseId);
  const { data: planning, isLoading } = useCoursePlanning(courseId);

  const createMilestone = useCreateMilestone(courseId);
  const updateMilestone = useUpdateMilestone(courseId);
  const deleteMilestone = useDeleteMilestone(courseId);
  const reorderMilestones = useReorderMilestones(courseId);

  const [view, setView] = useState<View>('hierarchy');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<typeof planning extends undefined ? never : NonNullable<typeof planning>['milestones'][number] | null>(null);
  const [deleting, setDeleting] = useState<NonNullable<typeof planning>['milestones'][number] | null>(null);

  if (isLoading) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Courses', to: '/courses' }, { label: 'Loading…' }]} />
        <SkeletonPageHeader />
        <div className="toolbar">
          <Skeleton height={36} width={140} radius="var(--radius-md)" />
        </div>
        <div className="skeleton-stack" style={{ marginTop: 24 }}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="card skeleton-card">
              <Skeleton height={20} width="35%" />
              <div style={{ marginTop: 12 }}>
                <SkeletonLines lines={2} />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }
  if (!planning || !course) return <p>Course not found.</p>;

  function moveMilestone(m: any, dir: -1 | 1) {
    const idx = planning!.milestones.findIndex((x) => x._id === m._id);
    if (idx < 0) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= planning!.milestones.length) return;
    const next = [...planning!.milestones];
    const [moved] = next.splice(idx, 1);
    next.splice(newIdx, 0, moved);
    reorderMilestones.mutate(next.map((x, i) => ({ id: x._id, order: i })));
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: 'Courses', to: '/courses' },
          { label: course.title, to: `/courses/${course._id}` },
          { label: 'Lab Planning' },
        ]}
      />
      <h1 className="page-title">{course.title}</h1>
      <p className="page-subtitle">Lab Planning — {planning.milestones.length} milestone(s)</p>

      <div className="toolbar">
        <div className="toolbar-left">
          <button className="button primary" onClick={() => setCreating(true)}>+ Milestone</button>
        </div>
        <div className="toolbar-right">
          <div className="tabs">
            <button className={`tab ${view === 'hierarchy' ? 'active' : ''}`} onClick={() => setView('hierarchy')}>Hierarchy</button>
            <button className={`tab ${view === 'board' ? 'active' : ''}`} onClick={() => setView('board')}>Board</button>
          </div>
          <Link className="chip" to={`/courses/${courseId}/roadmap`}>
            <span className="icon" aria-hidden="true">🗺</span>
            <span>See in roadmap</span>
          </Link>
        </div>
      </div>

      {view === 'hierarchy' ? (
        planning.milestones.length === 0 ? (
          <EmptyState
            title="No milestones yet"
            description="Create your first milestone to start planning this course."
            action={<button className="button primary" onClick={() => setCreating(true)}>+ Add Milestone</button>}
          />
        ) : (
          <div className="tree">
            {planning.milestones.map((m, idx) => (
              <div key={m._id} className="row" style={{ marginBottom: 4 }}>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <MilestoneItem
                    courseId={courseId}
                    milestone={m as any}
                    onEdit={() => setEditing(m as any)}
                    onDelete={() => setDeleting(m as any)}
                  />
                </div>
                <div className="row" style={{ gap: 4, alignItems: 'flex-start', paddingTop: 12 }}>
                  <ActionMenu
                    label="Reorder milestone"
                    align="right"
                    items={[
                      { label: 'Move up', icon: '↑', onClick: () => moveMilestone(m, -1), disabled: idx === 0 },
                      { label: 'Move down', icon: '↓', onClick: () => moveMilestone(m, 1), disabled: idx === planning.milestones.length - 1 },
                    ]}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        <KanbanBoard courseId={courseId} planning={planning} />
      )}

      <Link to={`/courses/${courseId}`} className="muted" style={{ display: 'inline-block', marginTop: 24 }}>← Back to course</Link>

      <Modal open={creating} title="Create Milestone" onClose={() => setCreating(false)}>
        <MilestoneForm
          onSubmit={(payload) =>
            createMilestone.mutate(payload, { onSuccess: () => setCreating(false) })
          }
          onCancel={() => setCreating(false)}
          submitting={createMilestone.isPending}
        />
      </Modal>

      <Modal open={!!editing} title="Edit Milestone" onClose={() => setEditing(null)}>
        {editing && (
          <MilestoneForm
            initial={editing}
            onSubmit={(payload) =>
              updateMilestone.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) })
            }
            onCancel={() => setEditing(null)}
            submitting={updateMilestone.isPending}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete Milestone?"
        message={
          deleting ? (
            <span>
              {deleting.modules.length > 0 ? (
                <>
                  This milestone contains <strong>{deleting.modules.length}</strong> module(s).
                  Please delete them first.
                </>
              ) : (
                <>Are you sure you want to delete <strong>{deleting.title}</strong>?</>
              )}
            </span>
          ) : null
        }
        danger
        confirmLabel="Delete"
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) deleteMilestone.mutate(deleting._id, {
            onSuccess: () => setDeleting(null),
            onError: () => setDeleting(null),
          });
        }}
      />
    </>
  );
}