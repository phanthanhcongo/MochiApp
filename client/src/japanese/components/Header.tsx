import  { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../routes/LanguageContext";
import { API_BASE_URL } from "../../apiClient";

const Header = () => {
  const [open, setOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false); // loading khi vào profile
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage(); // 'jp' | 'en'

  // Fetch user info (avatar_url và name) từ database
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const fetchUserInfo = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/me/language`, {
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
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
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
    setNavLoading(true);
    navigate(buildTo("/ProfileSettings"));
  };
  // const handleGoProfile = () => {
  //   setOpen(false);
  //   setNavLoading(true);
  //   navigate("/jp/ProfileSettings");
  // };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-gradient-to-r from-white/95 via-blue-50/95 to-purple-50/95 border-b border-gray-200/50 shadow-lg shadow-gray-200/20">
      <div className="flex items-center justify-between px-4 md:px-8 lg:px-16 py-3 md:py-4">
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <Link 
            to={buildTo("/home")}
            className="group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-lg blur-lg opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
            <h1 className="relative text-2xl md:text-3xl lg:text-4xl font-extrabold bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm group-hover:scale-105 transition-transform duration-300">
              成功
            </h1>
          </Link>
        </div>

        {/* Menu */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
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

        {/* User info + dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center space-x-2 md:space-x-3 focus:outline-none group relative"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="hidden md:flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
              <span className="text-blue-700 font-semibold text-sm md:text-base lg:text-lg">
                {userDisplay}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
              <img
                src={avatarUrl || "https://st.quantrimang.com/photos/image/2022/11/21/tai-sao-gojo-lai-deo-bit-mat-3.jpg"}
                alt="User"
                className="relative w-9 h-9 md:w-10 md:h-10 lg:w-12 lg:h-12 rounded-full border-4 border-yellow-400 shadow-lg object-cover group-hover:border-yellow-500 group-hover:scale-105 transition-all duration-300"
                onError={(e) => {
                  // Fallback nếu ảnh lỗi
                  (e.target as HTMLImageElement).src = "https://st.quantrimang.com/photos/image/2022/11/21/tai-sao-gojo-lai-deo-bit-mat-3.jpg";
                }}
              />
              {open && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-md"></div>
              )}
            </div>
          </button>

          {/* Dropdown menu */}
          {open && (
            <div
              role="menu"
              className="absolute right-0 mt-3 w-56 rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 overflow-hidden"
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
    <div className="flex flex-col items-center px-3 py-2 rounded-xl cursor-pointer transition-all duration-300 hover:bg-white/60 hover:shadow-md hover:scale-105">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-400 rounded-lg blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300"></div>
        <img 
          src={iconSrc} 
          alt={label} 
          className="relative w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 group-hover:scale-110 transition-transform duration-300 filter drop-shadow-sm" 
        />
      </div>
      <span className="mt-1 text-xs md:text-sm font-semibold text-gray-700 group-hover:text-blue-600 transition-colors duration-300 whitespace-nowrap">
        {label}
      </span>
    </div>
  </Link>
);

export default Header;
