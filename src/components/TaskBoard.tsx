import React, { useState } from 'react';
import TaskCard from './TaskCard';
import { Task, TaskStatus } from '../types';

interface ColumnDef {
  key: TaskStatus;
  title: string;
  className: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'TODO', title: 'To do', className: 'col-todo' },
  { key: 'IN_PROGRESS', title: 'In progress', className: 'col-progress' },
  { key: 'DONE', title: 'Done', className: 'col-done' },
];

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}

export default function TaskBoard({ tasks, onEdit, onStatusChange }: TaskBoardProps) {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  function handleDragStart(e: React.DragEvent, task: Task) {
    setDraggingId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverCol(null);
  }

  function handleDrop(e: React.DragEvent, status: TaskStatus) {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onStatusChange(taskId, status);
    }
    setDraggingId(null);
    setDragOverCol(null);
  }

  return (
    <div id="task-kanban-board" className="board">
      {COLUMNS.map((col) => {
        const isDoneCol = col.key === 'DONE';
        let rawItems = tasks.filter((t) => t.status === col.key);
        const totalInCol = rawItems.length;

        // In the Done column, only keep latest 3 visible completed tasks
        let displayItems = rawItems;
        let hiddenDoneCount = 0;
        if (isDoneCol) {
          // Sort by latest completed/updated date
          const sorted = [...rawItems].sort((a, b) => {
            const timeA = new Date(a.updatedAt || a.createdAt).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt).getTime();
            return timeB - timeA;
          });
          if (sorted.length > 3) {
            hiddenDoneCount = sorted.length - 3;
            displayItems = sorted.slice(0, 3);
          } else {
            displayItems = sorted;
          }
        }

        return (
          <div
            key={col.key}
            id={`column-${col.key.toLowerCase()}`}
            className={`column ${col.className}${dragOverCol === col.key ? ' drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCol(col.key);
            }}
            onDragLeave={() => setDragOverCol((cur) => (cur === col.key ? null : cur))}
            onDrop={(e) => handleDrop(e, col.key)}
          >
            <div className="col-head">
              <span className="bullet" />
              <span className="title">{col.title}</span>
              <span className="count" title={isDoneCol && hiddenDoneCount > 0 ? `${totalInCol} total completed (${hiddenDoneCount} older archived)` : `${totalInCol} tasks`}>
                {isDoneCol && hiddenDoneCount > 0 ? `3 of ${totalInCol}` : totalInCol}
              </span>
            </div>

            {displayItems.length === 0 ? (
              <div className="empty-col">
                {col.key === 'TODO' && 'Drop tasks here or create new tasks'}
                {col.key === 'IN_PROGRESS' && 'Drag tasks here when you start working'}
                {col.key === 'DONE' && 'Completed tasks will appear here'}
              </div>
            ) : (
              <div className="card-list">
                {displayItems.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={onEdit}
                    onStatusChange={onStatusChange}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                    dragging={draggingId === task.id}
                  />
                ))}

                {isDoneCol && hiddenDoneCount > 0 && (
                  <div
                    id="done-column-limit-indicator"
                    style={{
                      marginTop: '6px',
                      padding: '8px 10px',
                      background: 'rgba(69, 168, 151, 0.08)',
                      border: '1px dashed rgba(69, 168, 151, 0.3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '11.5px',
                      color: 'var(--ink-400)',
                      textAlign: 'center',
                    }}
                  >
                    Showing latest 3 completed • <span style={{ color: 'var(--teal)', fontWeight: 600 }}>+{hiddenDoneCount} older</span> in Analytics & Calendar
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
