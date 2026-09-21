import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../types';
import { loginRequest, registerRequest } from '../api/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<boolean>;
  register: (fullName: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  setError: (err: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('taskflow_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      localStorage.setItem('taskflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('taskflow_user');
    }
  }, [user]);

  async function login(email: string, password: string): Promise<boolean> {
    setLoading(true);
    setError('');
    try {
      const data = await loginRequest(email, password);
      localStorage.setItem('taskflow_token', data.token);
      const role = data.role || (data.email.toLowerCase() === '310625104024@eec.srmrmp.edu.in' ? 'ADMIN' : 'USER');
      setUser({ id: data.id, fullName: data.fullName, email: data.email, role });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not log in. Check your credentials and try again.';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }

  async function register(fullName: string, email: string, password: string): Promise<boolean> {
    setLoading(true);
    setError('');
    try {
      const data = await registerRequest(fullName, email, password);
      localStorage.setItem('taskflow_token', data.token);
      const role = data.role || (data.email.toLowerCase() === '310625104024@eec.srmrmp.edu.in' ? 'ADMIN' : 'USER');
      setUser({ id: data.id, fullName: data.fullName, email: data.email, role });
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Could not create your account. Try again.';
      setError(msg);
      return false;
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem('taskflow_token');
    localStorage.removeItem('taskflow_user');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
