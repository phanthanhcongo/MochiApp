import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation();

  // Match /jp/home, /en/home, và cho phép /home (fallback), có thể có dấu / ở cuối
  const isPracticePage = useMemo(
    () => /^\/(?:(jp|en)\/)?home(?:-grammar)?\/?$/.test(pathname),
    [pathname]
  );

  return (
    <div className="min-h-screen">
      {isPracticePage ? (
        children
      ) : (
        <div className="bg-[url('C:\Users\thanh\Desktop\ProjectWEb\client\public\103372501_p0.png')] bg-cover bg-center bg-gray-50/80 min-h-screen">
          <div className="w-full lg:w-[70%] min-h-screen mx-auto bg-slate-50">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

