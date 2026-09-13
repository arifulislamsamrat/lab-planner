import { useEffect, useState } from 'react';
import Modal from '../common/Modal';
import type { User } from '../../types/domain';
import { ROLES_CLIENT } from './roles';

interface Props {
  open: boolean;
  initial?: User | null;
  onSubmit: (payload: {
    name: string;
    email: string;
    password?: string;
    role: User['role'];
    isActive: boolean;
  }) => void;
  onCancel: () => void;
  submitting?: boolean;
}

export default function UserFormModal({ open, initial, onSubmit, onCancel, submitting }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('MINION');
  const [isActive, setIsActive] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(initial?.name ?? '');
    setEmail(initial?.email ?? '');
    setPassword('');
    setRole(initial?.role ?? 'MINION');
    setIsActive(initial?.isActive ?? true);
    setError(null);
  }, [open, initial]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const t = name.trim();
    const em = email.trim();
    if (!t) return setError('Name is required');
    if (!em) return setError('Email is required');
    const payload: Parameters<typeof onSubmit>[0] = {
      name: t, email: em, role, isActive,
    };
    if (!initial || password.length > 0) {
      if (password.length < 8) return setError('Password must be at least 8 characters');
      payload.password = password;
    }
    onSubmit(payload);
  }

  return (
    <Modal open={open} title={initial ? 'Edit user' : 'New user'} onClose={onCancel}>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus required />
        </div>
        <div className="field">
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>{initial ? 'New password (leave blank to keep current)' : 'Password'}</label>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={initial ? 'Leave blank to keep current' : 'At least 8 characters'}
          />
        </div>
        <div className="field">
          <label>Role</label>
          <select className="select" value={role} onChange={(e) => setRole(e.target.value as User['role'])}>
            {ROLES_CLIENT.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="field">
          <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span>Active</span>
          </label>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="modal-footer">
          <button type="button" className="button" onClick={onCancel}>Cancel</button>
          <button type="submit" className="button primary" disabled={submitting}>
            {submitting ? 'Saving…' : initial ? 'Save' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
