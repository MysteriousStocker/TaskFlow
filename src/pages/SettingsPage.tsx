import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTasks } from '../context/TasksContext';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { tasks } = useTasks();

  const initials = (user?.fullName || '?')
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <header id="settings-page-head" className="page-head">
        <div>
          <h1>Settings</h1>
          <div className="sub">Manage your profile, theme preference, and workspace.</div>
        </div>
      </header>

      <div id="settings-grid" style={{ display: 'grid', gap: '1.5rem', maxWidth: '640px' }}>
        <div className="analytics-card" style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div
            className="avatar"
            style={{ width: '56px', height: '56px', fontSize: '1.25rem', flexShrink: 0 }}
          >
            {initials}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 0.25rem 0', fontFamily: 'var(--font-display)', fontSize: '1.2rem' }}>
              {user?.fullName}
            </h3>
            <div style={{ color: 'var(--ink-400)', fontSize: '0.875rem' }}>{user?.email}</div>
            <div style={{ color: 'var(--ink-400)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
              User ID: <code style={{ color: 'var(--amber)' }}>{user?.id}</code>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">Theme &amp; Appearance</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
            <div>
              <div style={{ fontWeight: 500 }}>Interface Theme</div>
              <div style={{ color: 'var(--ink-400)', fontSize: '0.85rem' }}>
                Current theme is <strong>{theme === 'dark' ? 'Dark mode' : 'Light mode'}</strong>
              </div>
            </div>
            <button
              type="button"
              id="settings-theme-toggle-btn"
              className="btn-ghost"
              onClick={toggleTheme}
            >
              Switch to {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>
        </div>

        <div className="analytics-card">
          <div className="analytics-card-title">Workspace Data</div>
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ color: 'var(--ink-400)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              You currently have <strong>{tasks.length} tasks</strong> stored in your personal workspace.
              All tasks are automatically saved to server-side persistence and synchronized in real-time.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                id="settings-logout-btn"
                className="btn-ghost"
                onClick={logout}
                style={{ color: 'var(--coral)' }}
              >
                Sign out of TaskFlow
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
