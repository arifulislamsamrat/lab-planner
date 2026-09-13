import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_LABELS } from '../types/domain';
import ThemeToggle from '../components/common/ThemeToggle';
import SearchBar from '../components/navbar/SearchBar';

const SETTINGS_USERS_ROLES = ['ADMIN'];
const SETTINGS_DANGER_ROLES = ['ADMIN', 'COURSE_COORDINATOR'];
// "My Labs" is a personal workspace for people who execute or review labs.
// Planning-level roles (ADMIN, COURSE_COORDINATOR) manage labs via Courses / Lab Planning
// and don't need a per-user inbox.
const MY_LABS_ROLES = ['MINION', 'INSTRUCTOR'];
// Roles that plan / assign / review labs see the full management view.
// Minions see a read-only "Courses" entry.
const MANAGE_COURSES_ROLES = ['ADMIN', 'COURSE_COORDINATOR', 'INSTRUCTOR'];
const coursesLabel = (role: string) =>
  MANAGE_COURSES_ROLES.includes(role) ? 'Manage Courses' : 'Courses';

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

const CoursesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 4h12a3 3 0 0 1 3 3v13a1 1 0 0 1-1.6.8L13 14H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
    <path d="M8 8h7M8 11h5" />
  </svg>
);

const SettingsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
  </svg>
);

const SignOutIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

const MyLabsIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!user) return null;

  return (
    <div ref={ref} className="user-menu">
      <button
        type="button"
        className="user-menu-button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${user.name}`}
      >
        <span className="user-avatar" aria-hidden="true">{initialsOf(user.name)}</span>
        <span className="user-menu-name">{user.name}</span>
        <span className="user-menu-caret" aria-hidden="true">▾</span>
      </button>
      {open && (
        <div className="user-menu-dropdown" role="menu">
          <div className="user-menu-header">
            <div className="name">{user.name}</div>
            <div className="email">{user.email}</div>
            <div className="role mt-2">
              <span className={`role-pill ${user.role}`}>{ROLE_LABELS[user.role]}</span>
            </div>
          </div>
          <Link
            to="/settings"
            role="menuitem"
            className="user-menu-item"
            onClick={() => setOpen(false)}
          >
            <span className="nav-icon"><SettingsIcon /></span>
            Settings
          </Link>
          <button
            type="button"
            role="menuitem"
            className="user-menu-item danger"
            onClick={() => { setOpen(false); logout(); }}
          >
            <span className="nav-icon"><SignOutIcon /></span>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function AppLayout() {
  const { user } = useAuth();
  const showSettings = !!user && SETTINGS_USERS_ROLES.includes(user.role);
  const showDanger = !!user && SETTINGS_DANGER_ROLES.includes(user.role);
  const showMyLabs = !!user && MY_LABS_ROLES.includes(user.role);

  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand" aria-label="Lab Planner home">Lab Planner</Link>
        <SearchBar />
        <div className="header-actions">
          <ThemeToggle />
          <UserMenu />
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar">
          <div className="sidebar-section">Workspace</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><DashboardIcon /></span>
            <span>Dashboard</span>
          </NavLink>
          <NavLink to="/courses" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon"><CoursesIcon /></span>
            <span>{user ? coursesLabel(user.role) : 'Courses'}</span>
          </NavLink>
          {showMyLabs && (
            <NavLink to="/my-labs" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon"><MyLabsIcon /></span>
              <span>My Labs</span>
            </NavLink>
          )}

          {(showSettings || showDanger) && (
            <>
              <div className="sidebar-section">Administration</div>
              <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon"><SettingsIcon /></span>
                <span>Settings</span>
              </NavLink>
            </>
          )}
        </aside>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
