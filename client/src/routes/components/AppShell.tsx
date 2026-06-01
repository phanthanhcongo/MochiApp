import React, { useMemo } from 'react';
import { useLocation } from 'react-router-dom';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { pathname } = useLocation();

  // Xác định các trang protected bằng cách kiểm tra tiền tố ngôn ngữ /jp/ hoặc /en/
  const isProtectedPage = useMemo(
    () => /^\/(jp|en)\//.test(pathname),
    [pathname]
  );

  return (
    <div className="h-dvh">
      {isProtectedPage ? (
        children
      ) : (
        <div className="bg-[url('/103372501_p0.png')] bg-cover bg-center bg-gray-50/80 h-full">
          <div className="w-full lg:w-[70%]  mx-auto bg-slate-50 h-full">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

