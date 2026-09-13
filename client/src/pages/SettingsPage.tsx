import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import UsersTab from '../components/settings/UsersTab';
import RolesTab from '../components/settings/RolesTab';
import DangerZoneTab from '../components/settings/DangerZoneTab';
import RequireRole from '../components/auth/RequireRole';

type Tab = 'users' | 'roles' | 'danger';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('users');
  const { user } = useAuth();

  if (!user) return null;
  const canUsers = user.role === 'ADMIN';
  const canDanger = user.role === 'ADMIN' || user.role === 'COURSE_COORDINATOR';

  // Auto-pick a tab the user is allowed to see.
  if (tab === 'users' && !canUsers && canDanger) setTab('danger');

  return (
    <>
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">Manage users, roles, and dangerous actions.</p>

      <div className="tabs">
        {canUsers && (
          <button className={`tab ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
            Users
          </button>
        )}
        {canUsers && (
          <button className={`tab ${tab === 'roles' ? 'active' : ''}`} onClick={() => setTab('roles')}>
            Roles
          </button>
        )}
        {canDanger && (
          <button className={`tab ${tab === 'danger' ? 'active' : ''}`} onClick={() => setTab('danger')}>
            Danger Zone
          </button>
        )}
      </div>

      {tab === 'users' && (
        <RequireRole allow={['ADMIN']}>
          <UsersTab />
        </RequireRole>
      )}
      {tab === 'roles' && (
        <RequireRole allow={['ADMIN']}>
          <RolesTab />
        </RequireRole>
      )}
      {tab === 'danger' && (
        <RequireRole allow={['ADMIN', 'COURSE_COORDINATOR']}>
          <DangerZoneTab />
        </RequireRole>
      )}
    </>
  );
}
