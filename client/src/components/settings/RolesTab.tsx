import { useQuery } from '@tanstack/react-query';
import { roleApi } from '../../services/roleApi';
import { Skeleton } from '../common/Skeleton';

export default function RolesTab() {
  const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: roleApi.list });
  if (isLoading) {
    return (
      <div className="card skeleton-card" style={{ padding: 16 }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              gap: 16,
              padding: '12px 0',
              borderBottom: '1px solid var(--color-border-soft)',
            }}
          >
            <Skeleton height={22} width={120} radius="var(--radius-pill)" />
            <Skeleton height={14} width="60%" />
          </div>
        ))}
      </div>
    );
  }
  const roles = data ?? [];
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 220 }}>Role</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.key}>
              <td><span className={`role-pill ${r.key}`}>{r.label}</span></td>
              <td className="muted">{r.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
