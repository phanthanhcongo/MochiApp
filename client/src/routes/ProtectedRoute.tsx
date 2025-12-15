// src/routes/ProtectedRoute.tsx
import { Navigate, Outlet } from 'react-router-dom';
import type { ReactNode } from 'react';

export default function ProtectedRoute({ children }: { children?: ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  // Nếu có children thì render children, nếu không thì dùng <Outlet /> cho nested routes
  return <>{children ?? <Outlet />}</>;
}

