import { useState } from 'react';
import { Link, NavLink, useParams } from 'react-router-dom';
import { useCourse, useUpdateCourse } from '../hooks/useCourses';
import { useAuth } from '../hooks/useAuth';
import CourseForm from '../components/course/CourseForm';
import Modal from '../components/common/Modal';
import Breadcrumb from '../components/common/Breadcrumb';
import StatusBadge from '../components/common/StatusBadge';
import ShareButton from '../components/common/ShareButton';
import { Skeleton, SkeletonPageHeader, SkeletonLines } from '../components/common/Skeleton';

export default function CourseDetailsPage() {
  const { courseId = '' } = useParams<{ courseId: string }>();
  const { data: course, isLoading } = useCourse(courseId);
  const update = useUpdateCourse();
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);

  const canShareRoadmap = !!user && ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'].includes(user.role);

  if (isLoading) {
    return (
      <>
        <Breadcrumb items={[{ label: 'Courses', to: '/courses' }, { label: 'Loading…' }]} />
        <SkeletonPageHeader />
        <div className="toolbar">
          <div className="toolbar-right">
            <Skeleton height={28} width={70} radius="var(--radius-pill)" />
            <Skeleton height={28} width={120} radius="var(--radius-pill)" />
            <Skeleton height={28} width={130} radius="var(--radius-pill)" />
          </div>
        </div>
        <nav className="tabs">
          <Skeleton height={32} width={90} radius="var(--radius-md)" />
          <Skeleton height={32} width={110} radius="var(--radius-md)" />
          <Skeleton height={32} width={120} radius="var(--radius-md)" />
        </nav>
        <div className="card skeleton-card">
          <Skeleton height={20} width="30%" />
          <div style={{ marginTop: 16 }}>
            <SkeletonLines lines={3} />
          </div>
          <div style={{ marginTop: 16 }}>
            <Skeleton height={12} width="50%" />
          </div>
        </div>
      </>
    );
  }
  if (!course) return <p>Course not found.</p>;

  return (
    <>
      <Breadcrumb items={[{ label: 'Courses', to: '/courses' }, { label: course.title }]} />
      <div className="toolbar">
        <div>
          <h1 className="page-title">{course.title}</h1>
          <p className="page-subtitle">{course.description || 'No description.'}</p>
        </div>
        <div className="toolbar-right">
          <StatusBadge status={course.status} />
          <Link className="chip" to={`/courses/${courseId}/roadmap`}>
            <span className="icon" aria-hidden="true">🗺</span>
            <span>See in roadmap</span>
          </Link>
          {canShareRoadmap && (
            <ShareButton
              kind="COURSE_ROADMAP"
              refId={course._id}
              label="Share roadmap"
              description="Anyone with the link can view this course\u2019s roadmap (milestones, modules, lab groups, labs). No login required."
            />
          )}
          <button className="chip primary" onClick={() => setEditing(true)}>
            <span className="icon" aria-hidden="true">✏</span>
            <span>Edit Course</span>
          </button>
        </div>
      </div>

      <nav className="tabs">
        <NavLink to={`/courses/${courseId}`} end className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>Overview</NavLink>
        <NavLink to={`/courses/${courseId}/lab-planning`} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>Lab Planning</NavLink>
        <NavLink to={`/courses/${courseId}/roadmap`} className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}>See in roadmap</NavLink>
      </nav>

      <div className="card">
        <h3 className="mb-3">Overview</h3>
        <p className="muted">{course.description || 'Add a description to help your team understand what this course covers.'}</p>
        <p className="muted mt-4" style={{ fontSize: 12 }}>
          Created {new Date(course.createdAt).toLocaleString()} · Updated {new Date(course.updatedAt).toLocaleString()}
        </p>
      </div>

      <Modal open={editing} title="Edit Course" onClose={() => setEditing(false)}>
        <CourseForm
          initial={course}
          onSubmit={(payload) =>
            update.mutate({ id: course._id, payload }, { onSuccess: () => setEditing(false) })
          }
          onCancel={() => setEditing(false)}
          submitting={update.isPending}
        />
      </Modal>
    </>
  );
}