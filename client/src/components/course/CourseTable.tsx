import { Link } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import type { Course } from '../../types/domain';

interface Props {
  courses: Course[];
  onEdit: (c: Course) => void;
  onDelete?: (c: Course) => void;
}

export default function CourseTable({ courses, onEdit, onDelete }: Props) {
  if (courses.length === 0) {
    return (
      <div className="empty-state">
        <h3>No courses yet</h3>
        <p>Create your first course to start planning labs.</p>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Course</th>
            <th>Status</th>
            <th style={{ width: 220, textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c._id}>
              <td>
                <Link to={`/courses/${c._id}`} style={{ fontWeight: 600 }}>{c.title}</Link>
                {c.description && <div className="muted course-desc">{c.description}</div>}
              </td>
              <td><StatusBadge status={c.status} /></td>
              <td style={{ textAlign: 'right' }}>
                <div className="course-actions">
                  <Link className="chip" to={`/courses/${c._id}`}>
                    <span className="icon" aria-hidden="true">👁</span>
                    <span>View</span>
                  </Link>
                  <button className="chip" onClick={() => onEdit(c)}>
                    <span className="icon" aria-hidden="true">✏</span>
                    <span>Edit</span>
                  </button>
                  {onDelete && (
                    <button className="chip danger-chip" onClick={() => onDelete(c)}>
                      <span className="icon" aria-hidden="true">🗑</span>
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
