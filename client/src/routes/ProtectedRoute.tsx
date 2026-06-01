// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import Header from '../components/Header';

export default function ProtectedRoute({ children }: { children?: ReactNode }) {
  const token = localStorage.getItem('token');
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace />;

  const isQuizPage = location.pathname.includes('/quiz/');
  console.log('ProtectedRoute - Path:', location.pathname, 'isQuizPage:', isQuizPage);

  return (
    <div className="flex flex-col h-screen bg-slate-50/50 overflow-hidden">
      {!isQuizPage && (
        <div className="shrink-0">
          <Header />
        </div>
      )}
      <div className="flex-1 min-h-0 w-full flex flex-col">
        {children ?? <Outlet />}
      </div>
    </div>
  );
}

