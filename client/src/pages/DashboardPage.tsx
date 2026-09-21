import { Link } from 'react-router-dom';
import { useDashboardSummary } from '../hooks/useDashboard';
import StatusBadge from '../components/common/StatusBadge';
import { SkeletonStat, Skeleton, SkeletonPageHeader } from '../components/common/Skeleton';

export default function DashboardPage() {
  const { data, isLoading } = useDashboardSummary();

  if (isLoading) {
    return (
      <>
        <SkeletonPageHeader />
        <div className="stats">
          <SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat /><SkeletonStat />
        </div>
        <h3 className="mb-3">Recent Courses</h3>
        <div className="card skeleton-card">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: '1px solid var(--color-border-soft)' }}>
              <Skeleton height={14} width="50%" />
              <Skeleton height={14} width={80} />
            </div>
          ))}
        </div>
      </>
    );
  }
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