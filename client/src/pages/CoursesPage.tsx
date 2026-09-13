import { useState } from 'react';
import { useCourses, useCreateCourse, useUpdateCourse } from '../hooks/useCourses';
import CourseTable from '../components/course/CourseTable';
import CourseForm from '../components/course/CourseForm';
import Modal from '../components/common/Modal';
import Spinner from '../components/common/Spinner';
import { useAuth } from '../hooks/useAuth';
import type { Course } from '../types/domain';

const PLANNING_WRITE_ROLES = ['ADMIN', 'COURSE_COORDINATOR'];

export default function CoursesPage() {
  const { data, isLoading } = useCourses();
  const create = useCreateCourse();
  const update = useUpdateCourse();
  const { user } = useAuth();

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Course | null>(null);

  const canCreate = !!user && PLANNING_WRITE_ROLES.includes(user.role);

  if (isLoading) return <Spinner label="Loading courses..." />;

  return (
    <>
      <h1 className="page-title">Courses</h1>
      <p className="page-subtitle">Manage your courses and their lab planning.</p>
      <div className="toolbar">
        <div className="muted">{data?.length ?? 0} course(s)</div>
        <div className="toolbar-right">
          {canCreate && (
            <button className="button primary" onClick={() => setCreateOpen(true)}>+ Create Course</button>
          )}
        </div>
      </div>
      <p className="muted" style={{ fontSize: 12 }}>
        Course deletion is now in <strong>Settings → Danger Zone</strong>.
      </p>

      <CourseTable
        courses={data ?? []}
        onEdit={canCreate ? (c) => setEditing(c) : () => {}}
      />

      <Modal open={createOpen} title="Create Course" onClose={() => setCreateOpen(false)}>
        <CourseForm
          onSubmit={(payload) => create.mutate(payload, { onSuccess: () => setCreateOpen(false) })}
          onCancel={() => setCreateOpen(false)}
          submitting={create.isPending}
        />
      </Modal>

      <Modal open={!!editing} title="Edit Course" onClose={() => setEditing(null)}>
        {editing && (
          <CourseForm
            initial={editing}
            onSubmit={(payload) =>
              update.mutate({ id: editing._id, payload }, { onSuccess: () => setEditing(null) })
            }
            onCancel={() => setEditing(null)}
            submitting={update.isPending}
          />
        )}
      </Modal>
    </>
  );
}
