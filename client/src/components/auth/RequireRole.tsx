import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { Role } from '../../types/domain';

interface Props {
  allow: Role[];
  children: React.ReactNode;
  /** If true, render the children even when the role check fails. */
  fallbackTo?: React.ReactNode;
}

export default function RequireRole({ allow, children, fallbackTo }: Props) {
  const { user } = useAuth();
  if (user && allow.includes(user.role)) return <>{children}</>;
  if (fallbackTo !== undefined) return <>{fallbackTo}</>;
  return (
    <div className="card">
      <h3>Not allowed</h3>
      <p className="muted">
        You don't have permission to view this section.{' '}
        <Link to="/">Back to dashboard</Link>.
      </p>
    </div>
  );
}
