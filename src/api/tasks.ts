import { apiClient } from './client';
import { Task, TaskStatus, TaskPriority } from '../types';

export interface TaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export async function fetchTasks(): Promise<Task[]> {
  const { data } = await apiClient.get<Task[]>('/api/tasks');
  return data;
}

export async function createTask(payload: TaskPayload): Promise<Task> {
  const { data } = await apiClient.post<Task>('/api/tasks', payload);
  return data;
}

export async function updateTask(id: string, payload: TaskPayload): Promise<Task> {
  const { data } = await apiClient.put<Task>(`/api/tasks/${id}`, payload);
  return data;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
  const { data } = await apiClient.patch<Task>(`/api/tasks/${id}/status`, { status });
  return data;
}

export async function deleteTask(id: string): Promise<void> {
  await apiClient.delete(`/api/tasks/${id}`);
}
