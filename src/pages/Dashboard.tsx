import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../context/TasksContext';
import TaskBoard from '../components/TaskBoard';
import TaskModal from '../components/TaskModal';
import { Task, TaskPriority } from '../types';

function greetingTime() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const { tasks, loading, connected, counts, createTask, updateTask, updateStatus, deleteTask } = useTasks();
  const [modalTask, setModalTask] = useState<Task | null | 'NEW'>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | TaskPriority>('ALL');

  const firstName = user?.fullName?.split(' ')[0] || 'there';
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, priorityFilter]);

  return (
    <>
      <header id="dashboard-page-head" className="page-head">
        <div>
          <h1>{greetingTime()}, {firstName}</h1>
          <div className="sub">{todayLabel}</div>
        </div>

        <div className="page-head-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            id="connection-live-indicator"
            className="live-dot"
            title={connected ? 'Real-time WebSocket connection active' : 'Connecting to real-time service...'}
          >
            <span className="dot" />
            <span>{connected ? 'Live sync' : 'Connecting…'}</span>
          </span>

          <button
            type="button"
            id="new-task-btn"
            className="new-task-btn"
            onClick={() => setModalTask('NEW')}
          >
            + New task
          </button>
        </div>
      </header>

      <div id="quick-stats-strip" className="stat-strip">
        <div className="stat">
          <div className="num">{counts.todo}</div>
          <div className="label">To do</div>
        </div>
        <div className="stat">
          <div className="num amber">{counts.inProgress}</div>
          <div className="label">In progress</div>
        </div>
        <div className="stat">
          <div className="num teal">{counts.done}</div>
          <div className="label">Done</div>
        </div>
      </div>

      <div className="filter-bar" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        marginBottom: '1.25rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '220px', maxWidth: '400px' }}>
          <input
            id="task-search-input"
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--ink-800)',
              border: '1px solid var(--ink-700)',
              fontSize: '0.875rem',
              color: 'var(--paper)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--ink-400)',
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--ink-400)' }}>Priority:</span>
          {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPriorityFilter(p)}
              style={{
                padding: '0.3rem 0.6rem',
                fontSize: '0.75rem',
                borderRadius: '6px',
                border: '1px solid',
                cursor: 'pointer',
                borderColor: priorityFilter === p ? 'var(--amber)' : 'var(--ink-700)',
                background: priorityFilter === p ? 'var(--amber-dim)' : 'var(--ink-800)',
                color: priorityFilter === p ? 'var(--paper)' : 'var(--ink-400)',
                fontWeight: priorityFilter === p ? 600 : 400,
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && tasks.length === 0 ? (
        <div className="empty-col">Loading your board…</div>
      ) : (
        <TaskBoard
          tasks={filteredTasks}
          onEdit={(t) => setModalTask(t)}
          onStatusChange={updateStatus}
        />
      )}

      {modalTask && (
        <TaskModal
          task={modalTask === 'NEW' ? null : modalTask}
          onClose={() => setModalTask(null)}
          onSave={async (payload, taskId) => {
            if (taskId) {
              await updateTask(taskId, payload);
            } else {
              await createTask(payload);
            }
          }}
          onDelete={async (taskId) => {
            await deleteTask(taskId);
          }}
        />
      )}
    </>
  );
}
