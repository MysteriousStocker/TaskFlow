import { useState, useMemo } from 'react';
import { useTasks } from '../context/TasksContext';
import TaskModal from '../components/TaskModal';
import { Task } from '../types';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CalendarPage() {
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [newTaskDate, setNewTaskDate] = useState<string | null>(null);

  const tasksByDay = useMemo(() => {
    const map: Record<string, Task[]> = {};
    tasks.forEach((t) => {
      if (!t.dueDate) return;
      const key = t.dueDate;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const grid = useMemo(() => {
    const first = new Date(cursor.year, cursor.month, 1);
    const startOffset = first.getDay();
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startOffset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(cursor.year, cursor.month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const monthLabel = new Date(cursor.year, cursor.month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const todayKey = toDateKey(new Date());

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(c.year, c.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }

  function handleCellClick(date: Date) {
    const dateKey = toDateKey(date);
    setNewTaskDate(dateKey);
  }

  return (
    <>
      <header id="calendar-page-head" className="page-head">
        <div>
          <h1>Calendar</h1>
          <div className="sub">Tasks laid out by their due date. Click any date to schedule a new task.</div>
        </div>
        <div className="cal-nav">
          <button
            type="button"
            id="calendar-prev-month-btn"
            className="icon-btn cal-nav-btn"
            onClick={() => shiftMonth(-1)}
            aria-label="Previous month"
          >
            ←
          </button>
          <div className="cal-month-label">{monthLabel}</div>
          <button
            type="button"
            id="calendar-next-month-btn"
            className="icon-btn cal-nav-btn"
            onClick={() => shiftMonth(1)}
            aria-label="Next month"
          >
            →
          </button>
        </div>
      </header>

      <div id="task-calendar-container" className="calendar">
        <div className="cal-weekdays">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-weekday">
              {w}
            </div>
          ))}
        </div>

        <div className="cal-grid">
          {grid.map((date, i) => {
            if (!date) return <div key={i} className="cal-cell cal-cell-empty" />;

            const key = toDateKey(date);
            const dayTasks = tasksByDay[key] || [];
            const isToday = key === todayKey;

            return (
              <div
                key={i}
                id={`calendar-cell-${key}`}
                className={`cal-cell${isToday ? ' cal-cell-today' : ''}`}
                onClick={() => handleCellClick(date)}
                style={{ cursor: 'pointer' }}
                title={`Click to add task on ${key}`}
              >
                <div className="cal-date">{date.getDate()}</div>
                <div className="cal-tasks">
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className={`cal-task-chip priority-${t.priority}${t.status === 'DONE' ? ' status-done' : ''}`}
                      title={`${t.title} (${t.status})`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTask(t);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      {t.status === 'DONE' ? '✓ ' : ''}{t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="cal-more">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedTask && (
        <TaskModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={async (payload, taskId) => {
            if (taskId) await updateTask(taskId, payload);
          }}
          onDelete={async (taskId) => {
            await deleteTask(taskId);
          }}
        />
      )}

      {newTaskDate && !selectedTask && (
        <TaskModal
          task={{
            id: '',
            title: '',
            description: '',
            status: 'TODO',
            priority: 'MEDIUM',
            dueDate: newTaskDate,
            ownerId: '',
            createdAt: '',
          }}
          onClose={() => setNewTaskDate(null)}
          onSave={async (payload) => {
            await createTask(payload);
          }}
          onDelete={async () => {}}
        />
      )}
    </>
  );
}
