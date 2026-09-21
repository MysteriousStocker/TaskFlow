import { apiClient } from './client';
import { AdminOverviewResponse } from '../types';

export async function fetchAdminOverview(): Promise<AdminOverviewResponse> {
  const res = await apiClient.get<AdminOverviewResponse>('/api/admin/overview');
  return res.data;
}

export async function downloadAdminBackup(): Promise<any> {
  const res = await apiClient.get('/api/admin/backup');
  return res.data;
}
