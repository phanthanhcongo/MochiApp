import React, { Suspense, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import JpRoutes from './groups/jpRoutes';
import EnRoutes from './groups/enRoutes';
import { useLanguage } from './LanguageContext';

function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  // Match /jp/home, /en/home, và cho phép /home (fallback), có thể có dấu / ở cuối
  const isPracticePage = useMemo(
    () => /^\/(?:(jp|en)\/)?home\/?$/.test(pathname),
    [pathname]
  );

  return (
    <div className="min-h-screen">
      {isPracticePage ? (
        children
      ) : (
        <div className="bg-[url('https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbg.366f773b.webp&w=1920&q=75')] bg-cover bg-center bg-gray-50/80 min-h-screen">
          <div className="xl:w-[60%] min-h-screen mx-auto bg-slate-50">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppRoutes_2() {
  const { lang } = useLanguage();

  const group = useMemo(() => {
    if (!lang) return null;
    return lang === 'jp' ? <JpRoutes /> : <EnRoutes />;
  }, [lang]);

 if (!group) {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-yellow-400 border-solid"></div>
        <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-t-4 border-b-4 border-yellow-200 opacity-50"></div>
      </div>
      <p className="mt-6 text-xl font-medium text-gray-800">Đang tải ngôn ngữ...</p>
    </div>
  );
}


  return (
    <Suspense>
      <AppShell>{group}</AppShell>
    </Suspense>
  );
}
