// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';
import Header from '../components/Header';

export default function ProtectedRoute({ children }: { children?: ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 overflow-hidden">
      <div className="shrink-0">
        <Header />
      </div>
      <div className="flex-1 min-h-0 w-full flex flex-col">
        {children ?? <Outlet />}
      </div>
    </div>
  );
}

