import React from 'react';
import Sidebar from './Sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div id="app-shell" className="app-shell">
      <Sidebar />
      <main id="main-content" className="main main-content">
        {children}
      </main>
    </div>
  );
}
