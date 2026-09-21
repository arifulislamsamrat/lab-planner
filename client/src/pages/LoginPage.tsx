import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { extractErrorMessage } from '../services/apiClient';

export default function LoginPage() {
  const { status, user, bootstrap, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const from = location.state?.from && location.state.from !== '/login' ? location.state.from : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'loading') return null;
  if (status === 'authed' && user) return <Navigate to={from} replace />;

  const isBootstrapping = status === 'bootstrapping';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isBootstrapping) {
        await bootstrap({ name, email, password });
      } else {
        await login({ email, password });
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, isBootstrapping ? 'Could not create admin' : 'Could not sign in'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <div className="auth-mark" aria-hidden="true">
          <img
            src="https://s3.brilliant.com.bd/blog-bucket/thumbnail/8c5225dc-da97-48ab-9736-37d815e14439.png"
            alt=""
            className="auth-logo"
          />
          <span className="auth-mark-orb" />
          <span className="auth-mark-orb auth-mark-orb-2" />
        </div>
        <h1 className="auth-title">Lab Planner</h1>
        <p className="auth-subtitle muted">
          {isBootstrapping
            ? 'Create the first admin account to get started.'
            : 'Sign in to continue.'}
        </p>

        {isBootstrapping && (
          <div className="field">
            <label>Your name</label>
            <input
              className="input"
              autoFocus
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input
            className="input"
            type="email"
            required
            autoFocus={!isBootstrapping}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            className="input"
            type="password"
            required
            minLength={isBootstrapping ? 8 : 1}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isBootstrapping ? 'At least 8 characters' : ''}
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="button primary auth-submit" disabled={submitting}>
          {submitting
            ? isBootstrapping ? 'Creating…' : 'Signing in…'
            : isBootstrapping ? 'Create admin account' : 'Sign in'}
        </button>

        {isBootstrapping && (
          <p className="muted" style={{ fontSize: 12, marginTop: 12 }}>
            This screen appears only when no accounts exist yet. After this, only
            admins can create new users from <strong>Settings → Users</strong>.
          </p>
        )}
      </form>
    </div>
  );
}
