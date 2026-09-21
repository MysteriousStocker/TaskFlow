import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { Task, TaskCounts, TaskStatus } from '../types';
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  updateTaskStatus as apiUpdateTaskStatus,
  deleteTask as apiDeleteTask,
  TaskPayload,
} from '../api/tasks';
import { connectTaskSocket } from '../lib/socket';

interface TasksContextType {
  tasks: Task[];
  loading: boolean;
  connected: boolean;
  counts: TaskCounts;
  createTask: (payload: TaskPayload) => Promise<Task>;
  updateTask: (taskId: string, payload: TaskPayload) => Promise<Task>;
  updateStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
}

const TasksContext = createContext<TasksContextType | null>(null);

export function TasksProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);

  const refreshTasks = useCallback(async () => {
    if (!user) return;
    try {
      const data = await fetchTasks();
      setTasks(data);
    } catch (err) {
      console.error('Failed to load tasks', err);
    }
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user) return;

    setLoading(true);
    fetchTasks()
      .then((data) => {
        if (active) setTasks(data);
      })
      .catch((err) => {
        console.error('Initial fetch tasks failed', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const controller = connectTaskSocket(user.id, (event) => {
      setTasks((prev) => {
        if (event.type === 'DELETED') {
          return prev.filter((t) => t.id !== event.taskId);
        }
        if (event.type === 'CREATED' && event.task) {
          if (prev.some((t) => t.id === event.task?.id)) return prev;
          return [event.task, ...prev];
        }
        if (event.type === 'UPDATED' && event.task) {
          return prev.map((t) => (t.id === event.task?.id ? event.task! : t));
        }
        return prev;
      });
    });

    controller.onConnect = () => setConnected(true);
    controller.onWebSocketClose = () => setConnected(false);

    return () => controller.deactivate();
  }, [user]);

  async function createTask(payload: TaskPayload): Promise<Task> {
    const created = await apiCreateTask(payload);
    setTasks((prev) => {
      if (prev.some((t) => t.id === created.id)) return prev;
      return [created, ...prev];
    });
    return created;
  }

  async function updateTask(taskId: string, payload: TaskPayload): Promise<Task> {
    const updated = await apiUpdateTask(taskId, payload);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    return updated;
  }

  async function updateStatus(taskId: string, status: TaskStatus): Promise<void> {
    const current = tasks.find((t) => t.id === taskId);
    if (!current || current.status === status) return;

    // Optimistic UI update
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));

    try {
      await apiUpdateTaskStatus(taskId, status);
    } catch (err) {
      // Revert on failure
      setTasks((prev) => prev.map((t) => (t.id === taskId ? current : t)));
      throw err;
    }
  }

  async function deleteTask(taskId: string): Promise<void> {
    await apiDeleteTask(taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  const counts: TaskCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      todo: tasks.filter((t) => t.status === 'TODO').length,
      inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
      done: tasks.filter((t) => t.status === 'DONE').length,
      high: tasks.filter((t) => t.priority === 'HIGH').length,
      medium: tasks.filter((t) => t.priority === 'MEDIUM').length,
      low: tasks.filter((t) => t.priority === 'LOW').length,
      overdue: tasks.filter((t) => {
        if (!t.dueDate || t.status === 'DONE') return false;
        const [y, m, d] = t.dueDate.split('-').map(Number);
        const due = new Date(y, m - 1, d);
        return due < today;
      }).length,
    };
  }, [tasks]);

  return (
    <TasksContext.Provider
      value={{
        tasks,
        loading,
        connected,
        counts,
        createTask,
        updateTask,
        updateStatus,
        deleteTask,
        refreshTasks,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks(): TasksContextType {
  const context = useContext(TasksContext);
  if (!context) {
    throw new Error('useTasks must be used within a TasksProvider');
  }
  return context;
}
