import { apiClient } from './client';
import { AuthResponse, User } from '../types';

export async function loginRequest(email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', { email, password });
  return data;
}

export async function registerRequest(fullName: string, email: string, password: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', { fullName, email, password });
  return data;
}

export async function getMeRequest(): Promise<User> {
  const { data } = await apiClient.get<User>('/api/auth/me');
  return data;
}

export async function forgotPasswordRequest(email: string): Promise<{ success: boolean; message: string; resetCode?: string; email?: string }> {
  const { data } = await apiClient.post('/api/auth/forgot-password', { email });
  return data;
}

export async function resetPasswordRequest(email: string, resetCode: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const { data } = await apiClient.post('/api/auth/reset-password', { email, resetCode, newPassword });
  return data;
}

