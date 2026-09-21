import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { TasksProvider } from './context/TasksContext';
import AppLayout from './components/AppLayout';
import HelpButton from './components/HelpButton';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <TasksProvider>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </TasksProvider>
  );
}

function PublicOnlyRoute({ children }: { children: React.ReactElement }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
            <Route element={<ProtectedLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <HelpButton />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
