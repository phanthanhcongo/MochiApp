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
    <header className="flex items-center justify-between px-4 md:px-10 lg:px-16 py-2 md:py-4 bg-gray-100 shadow-md">
      {/* Logo */}
      <div className="flex items-center space-x-2">
        <Link to={buildTo("/home")}>
          <h1 className="text-xl md:text-2xl lg:text-4xl font-bold text-yellow-500">成功</h1>
        </Link>
      </div>

      {/* Menu */}
      <nav className="flex space-x-4 md:space-x-6 lg:space-x-10">
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
          className="flex items-center space-x-2 md:space-x-3 focus:outline-none"
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <span className="hidden md:block text-yellow-500 font-semibold text-sm md:text-base lg:text-lg">
            {userDisplay}
          </span>
          <img
            src={avatarUrl || "https://st.quantrimang.com/photos/image/2022/11/21/tai-sao-gojo-lai-deo-bit-mat-3.jpg"}
            alt="User"
            className="w-7 h-7 md:w-8 md:h-8 lg:w-10 lg:h-10 rounded-full border-2 border-yellow-400 object-cover"
            onError={(e) => {
              // Fallback nếu ảnh lỗi
              (e.target as HTMLImageElement).src = "https://st.quantrimang.com/photos/image/2022/11/21/tai-sao-gojo-lai-deo-bit-mat-3.jpg";
            }}
          />
        </button>

        {/* Dropdown menu */}
        {open && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-50 shadow-lg ring-1 ring-black/5 overflow-hidden animate-in fade-in zoom-in duration-100"
          >
            {/* đổi Link sang button để chủ động bật loading và navigate */}
            <button
              onClick={handleGoProfile}
              className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
              role="menuitem"
            >
              Profile settings
            </button>
            <button
              onClick={handleLogout}
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              role="menuitem"
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* Overlay loading khi điều hướng sang profile */}
      {navLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
      <div className="relative">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-yellow-400 border-solid"></div>
        <div className="absolute top-0 left-0 h-20 w-20 rounded-full border-t-4 border-b-4 border-yellow-200 opacity-50"></div>
      </div>
      <p className="mt-6 text-xl font-medium text-gray-800">Đang tải ngôn ngữ...</p>
    </div>
      )}
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
  <Link to={to}>
    <div className="flex flex-col items-center text-sm text-black cursor-pointer hover:text-yellow-600 transition">
      <img src={iconSrc} alt={label} className="w-6 h-6" />
      <span className="font-medium">{label}</span>
    </div>
  </Link>
);

export default Header;
