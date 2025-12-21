import  { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../routes/LanguageContext";
import { API_URL } from "../../apiClient";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false); // loading khi vào profile
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage(); // 'jp' | 'en'

  // Fetch user info (avatar_url và name) từ database
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUserInfo = async () => {
      try {
        const res = await fetch(`${API_URL}/me/language`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          if (data.avatar_url) {
            setAvatarUrl(data.avatar_url);
          }
          if (data.name) {
            setUserName(data.name);
          }
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();

    // Lắng nghe event khi avatar được cập nhật từ ProfileSettings
    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail?.avatar_url) {
        setAvatarUrl(event.detail.avatar_url);
      }
    };

    window.addEventListener("avatar-updated" as any, handleAvatarUpdate as EventListener);
    return () => {
      window.removeEventListener("avatar-updated" as any, handleAvatarUpdate as EventListener);
    };
  }, []);

  // đóng menu khi bấm ra ngoài hoặc nhấn Escape
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // nếu Header không unmount sau khi điều hướng
  // có thể tắt loading từ trang đích bằng cách dispatch sự kiện:
  // ở trang AccountSettings: useEffect(() => window.dispatchEvent(new Event("app:navigation-idle")), [])
  useEffect(() => {
    const off = () => setNavLoading(false);
    window.addEventListener("app:navigation-idle", off);
    return () => window.removeEventListener("app:navigation-idle", off);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setOpen(false);
    setMobileMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const userDisplay = userName;

  // chuẩn hóa đường dẫn có tiền tố ngôn ngữ
  const buildTo = (to: string) => {
    if (!to) return `/${lang}/home`;
    if (!to.startsWith("/")) to = `/${to}`;
    if (/^\/(jp|en)(\/|$)/.test(to)) return to;
    return `/${lang}${to}`;
  };

  const handleGoProfile = () => {
    setOpen(false);
    setMobileMenuOpen(false);
    setNavLoading(true);
    navigate(buildTo("/ProfileSettings"));
  };
  // const handleGoProfile = () => {
  //   setOpen(false);
  //   setNavLoading(true);
  //   navigate("/jp/ProfileSettings");
  // };

  return (
    <header className="relative w-full backdrop-blur-md bg-gradient-to-r from-white/95 via-blue-50/95 to-purple-50/95 border-b border-gray-200/50 shadow-lg shadow-gray-200/20 z-40">
      <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 lg:px-12 xl:px-16 py-1.5 sm:py-2 md:py-2.5">
        {/* Logo */}
        <div className="flex items-center min-w-0 flex-shrink-0">
          <Link 
            to={buildTo("/home")}
            className="relative block overflow-visible"
          >
            <h1 className="relative text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm overflow-visible whitespace-nowrap" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundImage: 'linear-gradient(to right, #eab308, #f59e0b, #f97316)' }}>
              成功
            </h1>
          </Link>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden md:flex items-center justify-center flex-1 mx-4 lg:mx-8 space-x-1 lg:space-x-2">
          <MenuItem
            iconSrc="https://kanji.mochidemy.com/_next/static/media/icon_graph.d55d6264.svg"
            label="Ôn tập"
            to={buildTo("home")}
          />
          <MenuItem
            iconSrc="https://kanji.mochidemy.com/_next/static/media/icon_graph.d55d6264.svg"
            label="Ôn tập Ngữ pháp"
            to={buildTo("home-grammar")}
          />
          <MenuItem
            iconSrc="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon_vocab.1963c4d5.png&w=384&q=75"
            label="Thêm từ mới"
            to={buildTo("add")}
          />
          <MenuItem
            iconSrc="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fsearch_icon.9524d432.png&w=256&q=75"
            label="List từ đã thêm"
            to={buildTo("listWord")}
          />
        </nav>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex items-center justify-end flex-shrink-0 relative z-50" ref={mobileMenuRef}>
          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex items-center justify-center focus:outline-none relative z-50"
            aria-label="Menu"
          >
            <div className="relative">
              <img
                src={avatarUrl || "https://st.quantrimang.com/photos/image/2022/11/21/tai-sao-gojo-lai-deo-bit-mat-3.jpg"}
                alt="User"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-yellow-400 shadow-lg object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://st.quantrimang.com/photos/image/2022/11/21/tai-sao-gojo-lai-deo-bit-mat-3.jpg";
                }}
              />
              {mobileMenuOpen && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-md"></div>
              )}
            </div>
          </button>

          {/* Mobile Dropdown Menu */}
          {mobileMenuOpen && (
            <div
              role="menu"
              className="fixed right-3 top-[60px] sm:top-[64px] w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 z-[60]"
              style={{
                animation: 'slideDown 0.2s ease-out'
              }}
            >
              <div className="py-2">
                {/* Navigation Items */}
                <MobileMenuItem
                  iconSrc="https://kanji.mochidemy.com/_next/static/media/icon_graph.d55d6264.svg"
                  label="Ôn tập"
                  to={buildTo("home")}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileMenuItem
                  iconSrc="https://kanji.mochidemy.com/_next/static/media/icon_graph.d55d6264.svg"
                  label="Ôn tập Ngữ pháp"
                  to={buildTo("home-grammar")}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileMenuItem
                  iconSrc="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon_vocab.1963c4d5.png&w=384&q=75"
                  label="Thêm từ mới"
                  to={buildTo("add")}
                  onClick={() => setMobileMenuOpen(false)}
                />
                <MobileMenuItem
                  iconSrc="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fsearch_icon.9524d432.png&w=256&q=75"
                  label="List từ đã thêm"
                  to={buildTo("listWord")}
                  onClick={() => setMobileMenuOpen(false)}
                />
                
                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                
                {/* Profile Options */}
                <button
                  onClick={handleGoProfile}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex items-center space-x-3 group"
                  role="menuitem"
                >
                  <svg className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 flex items-center space-x-3 group"
                  role="menuitem"
                >
                  <svg className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop User info + dropdown */}
        <div className="hidden md:flex md:items-center md:justify-end md:flex-shrink-0 md:relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center space-x-2 lg:space-x-3 focus:outline-none group relative"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
              <span className="text-blue-700 font-semibold text-sm">
                {userDisplay}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              <img
                src={avatarUrl || "https://st.quantrimang.com/photos/image/2022/11/21/tai-sao-gojo-lai-deo-bit-mat-3.jpg"}
                alt="User"
                className="relative w-8 h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full border-2 border-yellow-400 shadow-lg object-cover group-hover:border-yellow-500 group-hover:scale-105 transition-all duration-300"
                onError={(e) => {
                  // Fallback nếu ảnh lỗi
                  (e.target as HTMLImageElement).src = "https://st.quantrimang.com/photos/image/2022/11/21/tai-sao-gojo-lai-deo-bit-mat-3.jpg";
                }}
              />
              {open && (
                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full shadow-md"></div>
              )}
            </div>
          </button>

          {/* Dropdown menu */}
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-3 w-56 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50"
              style={{
                animation: 'slideDown 0.2s ease-out'
              }}
            >
              <div className="py-2">
                {/* đổi Link sang button để chủ động bật loading và navigate */}
                <button
                  onClick={handleGoProfile}
                  className="w-full text-left px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex items-center space-x-3 group"
                  role="menuitem"
                >
                  <svg className="w-5 h-5 text-blue-500 group-hover:text-blue-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Profile settings</span>
                </button>
                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-5 py-3 text-sm font-medium text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 flex items-center space-x-3 group"
                  role="menuitem"
                >
                  <svg className="w-5 h-5 text-red-500 group-hover:text-red-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay loading khi điều hướng sang profile */}
      {navLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-50">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-transparent border-t-yellow-400 border-r-amber-500 border-b-orange-500 border-l-yellow-400"></div>
            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-transparent border-t-yellow-200 border-r-amber-200 border-b-orange-200 border-l-yellow-200 opacity-50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="mt-8 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Đang tải...</p>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </header>
  );
};

// ---- MenuItem ----
type MenuItemProps = {
  iconSrc: string;
  label: string;
  to: string;
};

const MenuItem = ({ iconSrc, label, to }: MenuItemProps) => (
  <Link to={to} className="group relative">
    <div className="flex flex-col items-center justify-center px-2 py-1.5 lg:px-3 lg:py-2 rounded-lg lg:rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/60 hover:shadow-md hover:scale-105 min-w-[60px]">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
        <img 
          src={iconSrc} 
          alt={label} 
          className="relative w-5 h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm" 
        />
      </div>
      <span className="mt-1 text-[10px] md:text-xs font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300 whitespace-nowrap text-center">
        {label}
      </span>
    </div>
  </Link>
);

// ---- MobileMenuItem ----
type MobileMenuItemProps = {
  iconSrc: string;
  label: string;
  to: string;
  onClick: () => void;
};

const MobileMenuItem = ({ iconSrc, label, to, onClick }: MobileMenuItemProps) => (
  <Link 
    to={to} 
    onClick={onClick}
    className="w-full text-left px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex items-center space-x-3 group"
    role="menuitem"
  >
    <img 
      src={iconSrc} 
      alt={label} 
      className="w-5 h-5 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm" 
    />
    <span>{label}</span>
  </Link>
);

export default Header;
