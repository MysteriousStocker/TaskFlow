import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchAdminOverview, downloadAdminBackup } from '../api/admin';
import { AdminOverviewResponse, AdminUserRecord, AdminActivityRecord } from '../types';

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState<AdminOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'USERS' | 'ACTIVITIES' | 'BACKUP'>('USERS');
  const [userSearch, setUserSearch] = useState('');
  const [activityFilter, setActivityFilter] = useState('ALL');
  const [showFullHashes, setShowFullHashes] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [backupJsonString, setBackupJsonString] = useState<string>('');
  const [backupLoading, setBackupLoading] = useState(false);

  const isAdmin =
    user?.email?.toLowerCase() === '310625104024@eec.srmrmp.edu.in' || user?.role === 'ADMIN';

  useEffect(() => {
    if (isAdmin) {
      loadOverview();
    }
  }, [isAdmin]);

  async function loadOverview() {
    setLoading(true);
    setError('');
    try {
      const res = await fetchAdminOverview();
      setData(res);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch admin overview');
    } finally {
      setLoading(false);
    }
  }

  async function handleDownloadBackup() {
    try {
      setBackupLoading(true);
      const backupData = await downloadAdminBackup();
      const jsonStr = JSON.stringify(backupData, null, 2);
      setBackupJsonString(jsonStr);

      // Trigger browser file download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `taskflow-full-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Refresh activity list since BACKUP_EXPORTED was logged
      loadOverview();
    } catch (err: any) {
      alert('Error exporting backup: ' + (err.response?.data?.message || err.message));
    } finally {
      setBackupLoading(false);
    }
  }

  function toggleHashVisibility(userId: string) {
    setShowFullHashes((prev) => ({ ...prev, [userId]: !prev[userId] }));
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  }

  if (!isAdmin) {
    return (
      <div id="admin-access-denied" style={{ padding: '3rem 1.5rem', textAlign: 'center', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          fontSize: '3rem',
          marginBottom: '1rem',
          color: 'var(--coral)'
        }}>
          🛡️
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: '0.75rem' }}>
          Administrator Access Required
        </h1>
        <p style={{ color: 'var(--ink-400)', lineHeight: '1.6', marginBottom: '1.5rem' }}>
          The Admin and Backup console is strictly reserved for the master administrator account (<strong>310625104024@eec.srmrmp.edu.in</strong>).
          Your current signed-in email is <code>{user?.email}</code>.
        </p>
        <div style={{
          padding: '1rem',
          background: 'var(--ink-900)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--ink-700)',
          fontSize: '0.875rem'
        }}>
          Please log out and sign in using <strong>310625104024@eec.srmrmp.edu.in</strong> to view user credentials, system activity logs, and disaster recovery backups.
        </div>
      </div>
    );
  }

  const filteredUsers = (data?.users || []).filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.id.toLowerCase().includes(q);
  });

  const filteredActivities = (data?.activities || []).filter((act) => {
    if (activityFilter === 'ALL') return true;
    return act.action === activityFilter;
  });

  return (
    <div id="admin-management-page" style={{ paddingBottom: '3rem' }}>
      {/* Top Header */}
      <header className="page-head" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              background: 'var(--amber)',
              color: 'var(--ink-950)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase'
            }}>
              Master Administrator
            </span>
            <span style={{ color: 'var(--ink-400)', fontSize: '13px' }}>310625104024@eec.srmrmp.edu.in</span>
          </div>
          <h1 style={{ margin: 0, fontSize: '1.85rem' }}>Admin & Backup Console</h1>
          <div className="sub">
            Complete database oversight: User accounts, passwords & hashes, real-time activity logs, and full JSON backups.
          </div>
        </div>

        <div className="page-head-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={loadOverview}
            disabled={loading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--ink-800)',
              border: '1px solid var(--ink-700)',
              color: 'var(--paper)',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <span>🔄</span> {loading ? 'Refreshing…' : 'Refresh'}
          </button>

          <button
            type="button"
            id="admin-export-backup-btn"
            onClick={handleDownloadBackup}
            disabled={backupLoading}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--amber)',
              color: 'var(--ink-950)',
              fontWeight: 600,
              border: 'none',
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <span>💾</span> {backupLoading ? 'Exporting…' : 'Download Backup (.json)'}
          </button>
        </div>
      </header>

      {error && (
        <div className="form-error" style={{ marginBottom: '1.5rem', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)' }}>
          {error}
        </div>
      )}

      {/* Metrics Row */}
      <div id="admin-stats-grid" className="stat-strip" style={{ marginBottom: '1.75rem' }}>
        <div className="stat">
          <div className="num amber">{data?.stats.totalUsers ?? '…'}</div>
          <div className="label">Registered Users</div>
        </div>
        <div className="stat">
          <div className="num">{data?.stats.totalTasks ?? '…'}</div>
          <div className="label">Total System Tasks</div>
        </div>
        <div className="stat">
          <div className="num teal">{data?.stats.totalActivities ?? '…'}</div>
          <div className="label">Activity Audit Logs</div>
        </div>
        <div className="stat">
          <div className="num" style={{ fontSize: '1.15rem', color: 'var(--teal)', paddingTop: '6px' }}>
            {data?.stats.backupStatus || 'Persistent'}
          </div>
          <div className="label">Data Storage Engine</div>
        </div>
      </div>

      {/* Tabs bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        borderBottom: '1px solid var(--ink-700)',
        marginBottom: '1.5rem'
      }}>
        <button
          type="button"
          id="admin-tab-users"
          onClick={() => setActiveTab('USERS')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'USERS' ? '2px solid var(--amber)' : '2px solid transparent',
            color: activeTab === 'USERS' ? 'var(--amber)' : 'var(--ink-400)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>👥</span> User Accounts & Passwords ({data?.users.length || 0})
        </button>

        <button
          type="button"
          id="admin-tab-activities"
          onClick={() => setActiveTab('ACTIVITIES')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'ACTIVITIES' ? '2px solid var(--amber)' : '2px solid transparent',
            color: activeTab === 'ACTIVITIES' ? 'var(--amber)' : 'var(--ink-400)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>📜</span> User Activity Logs ({data?.activities.length || 0})
        </button>

        <button
          type="button"
          id="admin-tab-backup"
          onClick={() => {
            setActiveTab('BACKUP');
            if (!backupJsonString) {
              handleDownloadBackup();
            }
          }}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'BACKUP' ? '2px solid var(--amber)' : '2px solid transparent',
            color: activeTab === 'BACKUP' ? 'var(--amber)' : 'var(--ink-400)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <span>🗄️</span> Backup & Disaster Recovery
        </button>
      </div>

      {/* Tab 1: User Accounts & Passwords */}
      {activeTab === 'USERS' && (
        <div id="admin-users-view">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ maxWidth: '360px', width: '100%' }}>
              <input
                type="text"
                placeholder="Search by name, email, or user ID..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.8rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--ink-800)',
                  border: '1px solid var(--ink-700)',
                  color: 'var(--paper)',
                  fontSize: '0.85rem'
                }}
              />
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--ink-400)' }}>
              Showing {filteredUsers.length} of {data?.users.length || 0} registered users
            </div>
          </div>

          <div style={{
            background: 'var(--ink-900)',
            border: '1px solid var(--ink-700)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ background: 'var(--ink-800)', borderBottom: '1px solid var(--ink-700)', color: 'var(--ink-400)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 16px' }}>User Details</th>
                    <th style={{ padding: '12px 16px' }}>Email Address</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>Password & Cryptographic Hash</th>
                    <th style={{ padding: '12px 16px' }}>Tasks</th>
                    <th style={{ padding: '12px 16px' }}>Registered / Last Seen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isAnand = u.email.toLowerCase() === '310625104024@eec.srmrmp.edu.in';
                    const showFull = showFullHashes[u.id];

                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--ink-700)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--paper)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '50%',
                              background: isAnand ? 'var(--amber)' : 'var(--ink-700)',
                              color: isAnand ? 'var(--ink-950)' : 'var(--paper)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 700
                            }}>
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div>{u.fullName}</div>
                              <div style={{ fontSize: '11px', color: 'var(--ink-400)', fontFamily: 'monospace' }}>{u.id}</div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontWeight: 500, color: 'var(--paper)' }}>{u.email}</span>
                            <button
                              type="button"
                              onClick={() => copyToClipboard(u.email, `email_${u.id}`)}
                              title="Copy email"
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: copiedKey === `email_${u.id}` ? 'var(--teal)' : 'var(--ink-400)',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              {copiedKey === `email_${u.id}` ? '✓' : '📋'}
                            </button>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: '4px',
                            background: u.role === 'ADMIN' ? 'rgba(232, 162, 58, 0.15)' : 'var(--ink-800)',
                            color: u.role === 'ADMIN' ? 'var(--amber)' : 'var(--ink-400)',
                            border: u.role === 'ADMIN' ? '1px solid rgba(232, 162, 58, 0.3)' : '1px solid var(--ink-700)'
                          }}>
                            {u.role}
                          </span>
                        </td>

                        <td style={{ padding: '14px 16px', maxWidth: '320px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--ink-200)', marginBottom: '4px' }}>
                            <span style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--teal)',
                              marginRight: '6px'
                            }} />
                            {u.passwordStatus}
                          </div>
                          <div style={{
                            fontFamily: 'monospace',
                            fontSize: '11px',
                            background: 'var(--ink-950)',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            border: '1px solid var(--ink-700)',
                            color: 'var(--amber)',
                            wordBreak: 'break-all',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '8px'
                          }}>
                            <span>{showFull ? u.fullPasswordHash : u.passwordHashPreview}</span>
                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                              <button
                                type="button"
                                onClick={() => toggleHashVisibility(u.id)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: 'var(--ink-400)',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                                title={showFull ? 'Hide full hash' : 'Show full hash'}
                              >
                                {showFull ? '👁️' : '👁️‍🗨️'}
                              </button>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(u.fullPasswordHash, `hash_${u.id}`)}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: copiedKey === `hash_${u.id}` ? 'var(--teal)' : 'var(--ink-400)',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}
                                title="Copy hash for backup verification"
                              >
                                {copiedKey === `hash_${u.id}` ? '✓' : '📋'}
                              </button>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--paper)' }}>
                            {u.taskCount} tasks
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--teal)' }}>
                            {u.doneTasksCount} done
                          </div>
                        </td>

                        <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--ink-400)' }}>
                          <div>Joined: {new Date(u.createdAt).toLocaleDateString()}</div>
                          {u.lastLoginAt ? (
                            <div style={{ color: 'var(--ink-200)', marginTop: '2px' }}>
                              Active: {new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ) : (
                            <div style={{ color: 'var(--ink-400)', marginTop: '2px' }}>Never logged in</div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{
              padding: '12px 16px',
              background: 'var(--ink-800)',
              borderTop: '1px solid var(--ink-700)',
              fontSize: '11.5px',
              color: 'var(--ink-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '8px'
            }}>
              <div>
                🔒 <strong>Password Security Notice:</strong> Passwords are cryptographically hashed using salted Blowfish/Bcrypt (10 rounds). The hashes displayed above ensure tamper-proof user verification and disaster-recovery restoration without exposing plain-text keys.
              </div>
              <div style={{ color: 'var(--amber)' }}>
                Master Admin: 310625104024@eec.srmrmp.edu.in
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: User Activity Audit Logs */}
      {activeTab === 'ACTIVITIES' && (
        <div id="admin-activities-view">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--ink-400)' }}>Filter Action:</span>
              {['ALL', 'LOGIN', 'REGISTER', 'TASK_CREATED', 'TASK_UPDATED', 'TASK_STATUS_CHANGED', 'TASK_DELETED', 'BACKUP_EXPORTED'].map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => setActivityFilter(act)}
                  style={{
                    padding: '3px 8px',
                    fontSize: '11px',
                    borderRadius: '4px',
                    border: '1px solid',
                    borderColor: activityFilter === act ? 'var(--amber)' : 'var(--ink-700)',
                    background: activityFilter === act ? 'var(--amber-dim)' : 'var(--ink-800)',
                    color: activityFilter === act ? 'var(--paper)' : 'var(--ink-400)',
                    cursor: 'pointer'
                  }}
                >
                  {act}
                </button>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--ink-400)' }}>
              Total logs: {filteredActivities.length}
            </div>
          </div>

          <div style={{
            background: 'var(--ink-900)',
            border: '1px solid var(--ink-700)',
            borderRadius: 'var(--radius-md)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-card)'
          }}>
            {filteredActivities.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--ink-400)' }}>
                No activity logs found matching the filter.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--ink-800)', borderBottom: '1px solid var(--ink-700)', color: 'var(--ink-400)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.04em' }}>
                      <th style={{ padding: '12px 16px' }}>Timestamp</th>
                      <th style={{ padding: '12px 16px' }}>User</th>
                      <th style={{ padding: '12px 16px' }}>Action</th>
                      <th style={{ padding: '12px 16px' }}>Event Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.map((act) => {
                      let badgeColor = 'var(--ink-400)';
                      let badgeBg = 'var(--ink-800)';
                      if (act.action === 'LOGIN') {
                        badgeColor = 'var(--teal)';
                        badgeBg = 'rgba(69, 168, 151, 0.15)';
                      } else if (act.action === 'REGISTER') {
                        badgeColor = 'var(--amber)';
                        badgeBg = 'rgba(232, 162, 58, 0.15)';
                      } else if (act.action === 'TASK_CREATED') {
                        badgeColor = '#60A5FA';
                        badgeBg = 'rgba(96, 165, 250, 0.15)';
                      } else if (act.action === 'TASK_STATUS_CHANGED') {
                        badgeColor = '#A78BFA';
                        badgeBg = 'rgba(167, 139, 250, 0.15)';
                      } else if (act.action === 'TASK_DELETED') {
                        badgeColor = 'var(--coral)';
                        badgeBg = 'rgba(221, 106, 85, 0.15)';
                      } else if (act.action === 'BACKUP_EXPORTED') {
                        badgeColor = 'var(--amber)';
                        badgeBg = 'rgba(232, 162, 58, 0.2)';
                      }

                      return (
                        <tr key={act.id} style={{ borderBottom: '1px solid var(--ink-700)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--ink-400)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                            <div>{new Date(act.timestamp).toLocaleDateString()}</div>
                            <div style={{ color: 'var(--ink-200)' }}>{new Date(act.timestamp).toLocaleTimeString()}</div>
                          </td>

                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--paper)' }}>{act.userName}</div>
                            <div style={{ fontSize: '11px', color: 'var(--ink-400)' }}>{act.userEmail}</div>
                          </td>

                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              color: badgeColor,
                              background: badgeBg,
                              border: `1px solid ${badgeColor}33`,
                              display: 'inline-block'
                            }}>
                              {act.action}
                            </span>
                          </td>

                          <td style={{ padding: '12px 16px', color: 'var(--paper)' }}>
                            {act.details}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Backup & Disaster Recovery */}
      {activeTab === 'BACKUP' && (
        <div id="admin-backup-view">
          <div style={{
            background: 'var(--ink-900)',
            border: '1px solid var(--ink-700)',
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-card)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', marginBottom: '4px' }}>
                  Full Database Disaster Recovery Backup
                </h3>
                <p style={{ margin: 0, color: 'var(--ink-400)', fontSize: '0.875rem' }}>
                  Export an offline JSON snapshot containing all registered user accounts, bcrypt password hashes, kanban tasks, and historical activity trails.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => copyToClipboard(backupJsonString, 'backup_full_json')}
                  disabled={!backupJsonString}
                  style={{
                    padding: '0.5rem 0.9rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--ink-800)',
                    border: '1px solid var(--ink-700)',
                    color: 'var(--paper)',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  {copiedKey === 'backup_full_json' ? '✓ Copied to Clipboard' : '📋 Copy JSON'}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  disabled={backupLoading}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--amber)',
                    color: 'var(--ink-950)',
                    fontWeight: 600,
                    border: 'none',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  💾 Download .json File
                </button>
              </div>
            </div>

            <div style={{
              background: 'var(--ink-950)',
              border: '1px solid var(--ink-700)',
              borderRadius: 'var(--radius-sm)',
              padding: '1rem',
              maxHeight: '420px',
              overflowY: 'auto'
            }}>
              <pre style={{
                margin: 0,
                fontFamily: 'monospace',
                fontSize: '12px',
                color: 'var(--paper)',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all'
              }}>
                {backupJsonString || 'Loading backup archive preview…'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
