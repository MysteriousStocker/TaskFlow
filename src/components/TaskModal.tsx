import React, { useState } from 'react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { TaskPayload } from '../api/tasks';

interface TaskModalProps {
  task: Task | null;
  onClose: () => void;
  onSave: (payload: TaskPayload, taskId?: string) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export default function TaskModal({ task, onClose, onSave, onDelete }: TaskModalProps) {
  const [form, setForm] = useState<{
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string;
  }>({
    title: task ? task.title : '',
    description: task && task.description ? task.description : '',
    status: task ? task.status : 'TODO',
    priority: task ? task.priority : 'MEDIUM',
    dueDate: task && task.dueDate ? task.dueDate : '',
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError('Please provide a title');
      return;
    }

    setSaving(true);
    setError('');
    try {
      await onSave(
        {
          title: form.title.trim(),
          description: form.description.trim(),
          status: form.status,
          priority: form.priority,
          dueDate: form.dueDate || null,
        },
        task?.id
      );
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!task) return;
    if (!window.confirm(`Are you sure you want to delete "${task.title}"?`)) return;

    setDeleting(true);
    try {
      await onDelete(task.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete task');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div id="task-modal-backdrop" className="modal-backdrop" onClick={onClose}>
      <div id="task-modal" className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{task ? 'Edit task' : 'New task'}</h3>

        {error && <div className="form-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="modal-title">Title</label>
            <input
              id="modal-title"
              required
              value={form.title}
              onChange={(e) => update('title', e.target.value)}
              placeholder="Write a short, clear title"
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="modal-description">Description</label>
            <textarea
              id="modal-description"
              rows={3}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Add any detail that helps you pick this up later"
            />
          </div>

          <div className="two-col">
            <div className="field">
              <label htmlFor="modal-status">Status</label>
              <select
                id="modal-status"
                value={form.status}
                onChange={(e) => update('status', e.target.value as TaskStatus)}
              >
                <option value="TODO">To do</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="DONE">Done</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="modal-priority">Priority</label>
              <select
                id="modal-priority"
                value={form.priority}
                onChange={(e) => update('priority', e.target.value as TaskPriority)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="modal-dueDate">Due date</label>
            <input
              id="modal-dueDate"
              type="date"
              value={form.dueDate}
              onChange={(e) => update('dueDate', e.target.value)}
            />
          </div>

          <div className="modal-actions">
            {task && form.status !== 'DONE' && (
              <button
                type="button"
                id="modal-mark-done-btn"
                className="btn-mark-done-modal"
                onClick={async () => {
                  setSaving(true);
                  try {
                    await onSave({
                      title: form.title.trim(),
                      description: form.description.trim(),
                      status: 'DONE',
                      priority: form.priority,
                      dueDate: form.dueDate || null,
                    }, task.id);
                    onClose();
                  } catch (err: any) {
                    setError(err.response?.data?.message || 'Failed to update status');
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving || deleting}
              >
                ✓ Mark As Done
              </button>
            )}
            {task && (
              <button
                type="button"
                id="modal-delete-btn"
                className="btn-ghost"
                onClick={handleDelete}
                disabled={deleting || saving}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            )}
            <button
              type="button"
              id="modal-cancel-btn"
              className="btn-ghost"
              onClick={onClose}
              disabled={saving || deleting}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="modal-submit-btn"
              className="btn-primary"
              disabled={saving || deleting}
            >
              {saving ? 'Saving…' : task ? 'Save changes' : 'Create task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
