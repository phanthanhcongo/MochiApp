import { type ReactNode, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../routes/LanguageContext';

interface ChatLayoutProps {
  children: ReactNode;
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };

  const buildTo = (to: string) => {
    if (!to) return `/${lang}/home`;
    if (!to.startsWith('/')) to = `/${to}`;
    if (/^\/(jp|en)(\/|$)/.test(to)) return to;
    return `/${lang}${to}`;
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
    setOverlayOpen(!overlayOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
    setOverlayOpen(false);
  };

  // Get user email from localStorage
  const userEmail = localStorage.getItem('user_email') || 'Guest';

  return (
    <div className="flex h-[100dvh] w-full bg-[#F7F7F5] text-[#37352F]">
      {/* Overlay for mobile */}
      <div
        className={`fixed inset-0 bg-black/40 z-[200] md:hidden backdrop-blur-sm transition-opacity duration-300 ${overlayOpen ? 'opacity-100' : 'opacity-0 hidden'
          }`}
        onClick={closeSidebar}
      />

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-[210] flex flex-col w-64 h-full bg-[#F7F7F5] border-r border-[#E9E9E7] 
        transition-transform duration-300 ease-in-out shadow-2xl md:shadow-none
        ${sidebarOpen ? '' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-gray-700">
            <div className="w-6 h-6 bg-red-500 rounded text-white flex items-center justify-center text-xs font-bold">
              日
            </div>
            Japience
          </div>
          <button className="md:hidden p-1 hover:bg-gray-200 rounded" onClick={closeSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 no-scrollbar">
          {/* Tab Navigation */}
          <div className="px-1 mb-4">
            <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[#EFEFED]/80 rounded-2xl">
              <button
                onClick={() => navigate(buildTo('home-grammar'))}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                  <path d="M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"></path>
                  <path d="M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12"></path>
                  <path d="M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17"></path>
                </svg>
                <span className="text-[10px] font-bold leading-none font-medium">Ngữ pháp</span>
              </button>
              <button
                onClick={() => navigate(buildTo('home'))}
                className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all duration-200 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-80">
                  <path d="m16 6 4 14"></path>
                  <path d="M12 6v14"></path>
                  <path d="M8 8v12"></path>
                  <path d="M4 4v16"></path>
                </svg>
                <span className="text-[10px] font-bold leading-none font-medium">Từ vựng</span>
              </button>
              <button className="flex flex-col items-center justify-center gap-1.5 py-2 px-1 rounded-xl transition-all duration-200 bg-white shadow-sm ring-1 ring-black/5 text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="6"></circle>
                  <circle cx="12" cy="12" r="2"></circle>
                </svg>
                <span className="text-[10px] font-bold leading-none ">Luyện tập</span>
              </button>
            </div>
          </div>

          {/* Practice Area */}
          <div className="flex flex-col gap-2 p-3">
            <div className="px-2 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              Khu vực luyện tập
            </div>
            <button
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-white text-indigo-600 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 8V4H8"></path>
                <rect width="16" height="12" x="4" y="8" rx="2"></rect>
                <path d="M2 14h2"></path>
                <path d="M20 14h2"></path>
                <path d="M15 13v2"></path>
                <path d="M9 13v2"></path>
              </svg>
              Trò chuyện AI
            </button>
            <button
              disabled
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-300 cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"></path>
                <path d="M22 10v6"></path>
                <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"></path>
              </svg>
              Luyện thi JLPT
            </button>
          </div>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-gray-200 bg-[#F7F7F5]">
          <div className="mb-4 bg-purple-50 hover:bg-purple-100 text-purple-700 p-2.5 rounded-lg border border-purple-200 cursor-pointer transition-all flex flex-col gap-0.5 group">
            <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"></path>
                <path d="M20 2v4"></path>
                <path d="M22 4h-4"></path>
                <circle cx="4" cy="20" r="2"></circle>
              </svg>
              Nâng cấp VIP
            </div>
            <p className="text-[9px] opacity-80 leading-tight">Không giới hạn AI và nội dung.</p>
          </div>

          <div className="flex items-center gap-3 w-full">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate" title={userEmail}>
                {userEmail}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">Free Plan</p>
                <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-gray-100 rounded border border-gray-200" title="AI Usage: 0/10">
                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500">
                    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"></path>
                  </svg>
                  <span className="text-[10px] font-mono font-medium text-gray-600">0/10</span>
                </div>
              </div>
            </div>
            <button
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
              title="Đăng xuất"
              onClick={handleLogout}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m16 17 5-5-5-5"></path>
                <path d="M21 12H9"></path>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-gray-100 z-50 flex items-center px-4 justify-between">
        <div className="flex items-center gap-3">
          <button className="p-1 hover:bg-gray-100 rounded" onClick={toggleSidebar}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5h16"></path>
              <path d="M4 12h16"></path>
              <path d="M4 19h16"></path>
            </svg>
          </button>
          <span className="font-semibold text-gray-800">Japience</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden flex flex-col pt-14 md:pt-0 relative">
        {children}
      </main>
    </div>
  );
}
