import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const TABS = [
  {
    to: '/',
    label: 'Board',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="7" height="16" rx="1.5" />
        <rect x="13" y="4" width="8" height="9" rx="1.5" />
        <rect x="13" y="16" width="8" height="4" rx="1.5" />
      </svg>
    ),
  },
  {
    to: '/calendar',
    label: 'Calendar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M3 10h18M8 3v4M16 3v4" />
      </svg>
    ),
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19V10M12 19V5M20 19v-7" />
      </svg>
    ),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const isAdmin = user?.email?.toLowerCase() === '310625104024@eec.srmrmp.edu.in' || user?.role === 'ADMIN';

  const initials = (user?.fullName || '?')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const tabs = [
    ...TABS,
    ...(isAdmin
      ? [
          {
            to: '/admin',
            label: 'Admin & Backup',
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            ),
          },
        ]
      : []),
  ];

  return (
    <aside id="app-sidebar" className="sidebar">
      <div className="brand">
        <span className="brand-logo">TaskFlow</span>
      </div>

      <nav className="sidebar-nav">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) => `nav-tab${isActive ? ' active' : ''}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="side-footer">
        <div className="avatar" title={user?.fullName}>{initials}</div>
        <div className="who">
          <div className="name" title={user?.fullName} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>{user?.fullName}</span>
            {isAdmin && (
              <span style={{
                fontSize: '9px',
                padding: '1px 5px',
                borderRadius: '3px',
                background: 'var(--amber)',
                color: 'var(--ink-950)',
                fontWeight: 700,
                letterSpacing: '0.04em'
              }}>
                ADMIN
              </span>
            )}
          </div>
          <div className="email" title={user?.email}>{user?.email}</div>
        </div>
        <button id="sidebar-logout-btn" type="button" className="logout-btn" onClick={logout}>
          Log out
        </button>
        <ThemeToggle className="sidebar-theme-toggle" />
      </div>
    </aside>
  );
}
