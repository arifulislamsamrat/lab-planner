import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCourses } from '../hooks/useCourses';
import EmptyState from '../components/common/EmptyState';
import KanbanModal from '../components/kanban/KanbanModal';
import { Skeleton } from '../components/common/Skeleton';

/**
 * Workspace-level Kanban Board page. The interactive board opens in a
 * full-screen modal popup that owns the viewport. The page itself provides
 * a short summary + the trigger to open the modal.
 */
export default function KanbanPage() {
  const { data: courses, isLoading } = useCourses();
  const [open, setOpen] = useState(true);

  if (isLoading) {
    return (
      <>
        <div className="toolbar">
          <div>
            <h1 className="page-title">Kanban Board</h1>
            <p className="page-subtitle">Loading…</p>
          </div>
        </div>
        <div className="card skeleton-card" style={{ padding: 16 }}>
          <Skeleton height={20} width="40%" />
          <div style={{ marginTop: 16 }}>
            <Skeleton height={14} width="70%" />
          </div>
        </div>
      </>
    );
  }

  const courseCount = courses?.length ?? 0;

  return (
    <>
      <div className="toolbar">
        <div>
          <h1 className="page-title">Kanban Board</h1>
          <p className="page-subtitle">
            Track every lab's status across all {courseCount} course{courseCount === 1 ? '' : 's'}.
            Drag cards to change status, click the status pill to set one, or use the ⋮ menu to reassign, share, or open.
          </p>
        </div>
        <div className="toolbar-right">
          {courseCount > 0 && (
            <button className="button primary" onClick={() => setOpen(true)}>
              Open board
            </button>
          )}
        </div>
      </div>

      {courseCount === 0 ? (
        <EmptyState
          title="No courses yet"
          description="Create your first course to start tracking labs on the board."
          action={
            <Link className="button primary" to="/courses">
              Go to Courses
            </Link>
          }
        />
      ) : (
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <h3 style={{ margin: 0 }}>Welcome</h3>
          <p className="muted" style={{ margin: 0 }}>
            The Kanban board opens as a full-screen popup so columns fit side-by-side without scrolling.
            You can reopen it anytime from the toolbar above, or by visiting <code>/kanban</code>.
          </p>
          <div>
            <button className="button primary" onClick={() => setOpen(true)}>
              Open Kanban Board
            </button>
          </div>
        </div>
      )}

      <KanbanModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
