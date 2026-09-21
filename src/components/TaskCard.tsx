import React from 'react';
import { Task, TaskStatus } from '../types';

function isOverdue(dueDate?: string | null, status?: string): boolean {
  if (!dueDate || status === 'DONE') return false;
  const parts = dueDate.split('-').map(Number);
  if (parts.length < 3) return false;
  const due = new Date(parts[0], parts[1] - 1, parts[2]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function formatDate(dateStr?: string | null): string | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-').map(Number);
  if (parts.length < 3) return dateStr;
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
  onDragEnd: () => void;
  dragging?: boolean;
}

export default function TaskCard({
  task,
  onEdit,
  onStatusChange,
  onDragStart,
  onDragEnd,
  dragging,
}: TaskCardProps) {
  const isDone = task.status === 'DONE';
  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <div
      id={`task-card-${task.id}`}
      className={`task-card priority-${task.priority}${isDone ? ' is-done' : ''}${dragging ? ' dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onDragEnd={onDragEnd}
      onClick={() => onEdit(task)}
    >
      <div className="title">
        {isDone && (
          <span className="title-check-icon" title="Completed">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
        {task.title}
      </div>

      {task.description && <div className="desc">{task.description}</div>}

      <div className="meta-row">
        <span className={`badge ${task.priority}`}>{task.priority}</span>
        {task.dueDate && (
          <span className={`due${overdue ? ' overdue' : ''}`}>
            {overdue ? 'Overdue · ' : ''}
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>

      <div className="card-action-bar" onClick={(e) => e.stopPropagation()}>
        {!isDone ? (
          <button
            type="button"
            id={`mark-done-btn-${task.id}`}
            className="mark-done-btn"
            onClick={() => onStatusChange?.(task.id, 'DONE')}
            title="Mark as Done"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span>Mark As Done</span>
          </button>
        ) : (
          <div className="completed-indicator">
            <span className="completed-badge">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Done</span>
            </span>
            <button
              type="button"
              id={`reopen-btn-${task.id}`}
              className="reopen-link"
              onClick={() => onStatusChange?.(task.id, 'TODO')}
              title="Move back to To do"
            >
              Reopen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
