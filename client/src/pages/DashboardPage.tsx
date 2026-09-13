import { Link } from 'react-router-dom';
import { useDashboardSummary } from '../hooks/useDashboard';
import Spinner from '../components/common/Spinner';
import StatusBadge from '../components/common/StatusBadge';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) return <Spinner label="Loading summary..." />;
  const { counts, recentCourses } = data!;

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">High-level snapshot of your planning content.</p>

      <div className="stats">
        <Stat label="Courses" value={counts.courses} />
        <Stat label="Milestones" value={counts.milestones} />
        <Stat label="Modules" value={counts.modules} />
        <Stat label="Lab Groups" value={counts.labGroups} />
        <Stat label="Labs" value={counts.labs} />
      </div>

      <h3 className="mb-3">Recent Courses</h3>
      {recentCourses.length === 0 ? (
        <div className="empty-state">
          <h3>No courses yet</h3>
          <p>Start by creating your first course.</p>
          <Link to="/courses" className="button primary">Go to Courses</Link>
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentCourses.map((c) => (
                <tr key={c._id}>
                  <td><Link to={`/courses/${c._id}`}>{c.title}</Link></td>
                  <td><StatusBadge status={c.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
    </div>
  );
}