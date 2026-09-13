import { Navigate, useLocation } from 'react-router-dom';
import Spinner from '../common/Spinner';
import { useAuth } from '../../hooks/useAuth';

export default function RequireAuth({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <Spinner label="Loading..." />;
  if (status === 'bootstrapping') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (status === 'unauthed') return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <>{children}</>;
}
