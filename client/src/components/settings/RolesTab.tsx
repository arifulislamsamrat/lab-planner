import { useQuery } from '@tanstack/react-query';
import { roleApi } from '../../services/roleApi';
import Spinner from '../common/Spinner';

export default function RolesTab() {
  const { data, isLoading } = useQuery({ queryKey: ['roles'], queryFn: roleApi.list });
  if (isLoading) return <Spinner label="Loading roles..." />;
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
