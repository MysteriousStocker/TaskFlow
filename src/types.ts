export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role?: 'ADMIN' | 'USER';
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string | null;
  ownerId: string;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AuthResponse {
  token: string;
  id: string;
  fullName: string;
  email: string;
  role?: 'ADMIN' | 'USER';
}

export interface TaskCounts {
  todo: number;
  inProgress: number;
  done: number;
  high: number;
  medium: number;
  low: number;
  overdue: number;
}

export interface TaskEvent {
  type: 'CREATED' | 'UPDATED' | 'DELETED' | 'CONNECTED';
  task?: Task | null;
  taskId?: string | null;
}

export interface AdminUserRecord {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  createdAt: string;
  lastLoginAt?: string | null;
  taskCount: number;
  doneTasksCount: number;
  passwordStatus: string;
  passwordHashPreview: string;
  fullPasswordHash: string;
}

export interface AdminActivityRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface AdminOverviewResponse {
  stats: {
    totalUsers: number;
    totalTasks: number;
    totalActivities: number;
    backupStatus: string;
    serverUptime: number;
  };
  users: AdminUserRecord[];
  activities: AdminActivityRecord[];
}
