import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../../routes/LanguageContext";
import { API_URL } from "../../apiClient";
import {
  BarChart3,
  Layers,
  PlusCircle,
  List,
  MessageCircle,
  LogOut,
  Settings,
  Menu,
  X,
} from "lucide-react";

// ── Avatar Fallback ──────────────────────────────────────────
const AvatarFallback = ({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) => {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold border-2 border-yellow-400 shadow-lg select-none ${className}`}
    >
      {initials || "U"}
    </div>
  );
};

// ── Language Toggle ──────────────────────────────────────────
const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSwitch = (target: "jp" | "en") => {
    if (target === lang) return;
    setLang(target);
    // Rewrite current URL to new lang prefix
    const newPath = location.pathname.replace(/^\/(jp|en)/, `/${target}`);
    navigate(newPath, { replace: true });
  };

  return (
    <div className="flex items-center bg-gray-100/80 rounded-full p-0.5 border border-gray-200/60">
      <button
        onClick={() => handleSwitch("jp")}
        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 cursor-pointer ${
          lang === "jp"
            ? "bg-white shadow-sm text-amber-600 scale-105"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        🇯🇵 JP
      </button>
      <button
        onClick={() => handleSwitch("en")}
        className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition-all duration-300 cursor-pointer ${
          lang === "en"
            ? "bg-white shadow-sm text-blue-600 scale-105"
            : "text-gray-400 hover:text-gray-600"
        }`}
      >
        🇬🇧 EN
      </button>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// ██  HEADER
// ══════════════════════════════════════════════════════════════
const Header = () => {
  const [open, setOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [navLoading, setNavLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { lang } = useLanguage();

  // ── Fetch user info ──
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
          if (data.avatar_url) setAvatarUrl(data.avatar_url);
          if (data.name) setUserName(data.name);
        }
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();

    const handleAvatarUpdate = (event: CustomEvent) => {
      if (event.detail?.avatar_url) setAvatarUrl(event.detail.avatar_url);
    };
    window.addEventListener(
      "avatar-updated" as any,
      handleAvatarUpdate as EventListener
    );
    return () =>
      window.removeEventListener(
        "avatar-updated" as any,
        handleAvatarUpdate as EventListener
      );
  }, []);

  // ── Close menus on click outside / Escape ──
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setOpen(false);
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target as Node)
      )
        setMobileMenuOpen(false);
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

  // ── Navigation idle listener ──
  useEffect(() => {
    const off = () => setNavLoading(false);
    window.addEventListener("app:navigation-idle", off);
    return () => window.removeEventListener("app:navigation-idle", off);
  }, []);

  // ── Helpers ──
  const buildTo = (to: string) => {
    if (!to) return `/${lang}/home`;
    if (!to.startsWith("/")) to = `/${to}`;
    if (/^\/(jp|en)(\/|$)/.test(to)) return to;
    return `/${lang}${to}`;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setOpen(false);
    setMobileMenuOpen(false);
    navigate("/login", { replace: true });
  };

  const handleGoProfile = () => {
    setOpen(false);
    setMobileMenuOpen(false);
    setNavLoading(true);
    navigate(buildTo("/ProfileSettings"));
  };

  // ── Nav items config ──
  const navItems = [
    {
      icon: BarChart3,
      label: "Ôn tập",
      to: buildTo("home"),
    },
    {
      icon: Layers,
      label: "Ngữ pháp",
      to: buildTo("home-grammar"),
    },
    {
      icon: PlusCircle,
      label: "Thêm từ mới",
      to: buildTo("add"),
    },
    {
      icon: List,
      label: "Danh sách từ",
      to: buildTo("listWord"),
    },
    {
      icon: MessageCircle,
      label: "Chat AI",
      to: buildTo("chat"),
    },
  ];

  // ── Avatar renderer ──
  const renderAvatar = (size: string) => {
    if (avatarUrl) {
      return (
        <img
          src={avatarUrl}
          alt={userName}
          className={`${size} rounded-full border-2 border-yellow-400 shadow-lg object-cover`}
          onError={() => setAvatarUrl(null)}
        />
      );
    }
    return <AvatarFallback name={userName} className={size} />;
  };

  return (
    <header className="relative w-full backdrop-blur-md bg-gradient-to-r from-white/95 via-blue-50/95 to-purple-50/95 border-b border-gray-200/50 shadow-md shadow-gray-200/10 z-40">
      <div className="flex items-center justify-between px-2 sm:px-4 md:px-6 lg:px-8 py-0.5 sm:py-1">
        {/* ── Logo ── */}
        <div className="flex items-center min-w-0 flex-shrink-0">
          <Link to={buildTo("/home")} className="relative block group">
            <div className="flex items-center gap-1">
              <span className="text-base sm:text-lg">🌸</span>
              <h1
                className="relative text-lg sm:text-xl font-extrabold bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500 bg-clip-text text-transparent drop-shadow-sm whitespace-nowrap group-hover:from-orange-500 group-hover:via-amber-500 group-hover:to-yellow-500 transition-all duration-500"
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                成功
              </h1>
            </div>
          </Link>
        </div>

        {/* ── Desktop Navigation ── */}
        <nav className="hidden md:flex items-center justify-center flex-1 mx-4 lg:mx-8 gap-1 lg:gap-1.5">
          {navItems.map((item) => (
            <MenuItem
              key={item.to}
              icon={item.icon}
              label={item.label}
              to={item.to}
            />
          ))}
        </nav>

        {/* ── Desktop Right: Lang Toggle + User ── */}
        <div
          className="hidden md:flex md:items-center md:gap-3 md:flex-shrink-0 relative"
          ref={menuRef}
        >
          <LanguageToggle />

          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 lg:gap-3 focus:outline-none group relative cursor-pointer"
            aria-haspopup="menu"
            aria-expanded={open}
          >
            <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/30">
              <span className="text-blue-700 font-bold text-[9px]">
                {userName}
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 rounded-full blur-sm opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
              {renderAvatar(
                "relative w-5 h-5 md:w-6 md:h-6 text-[8px] md:text-[9px]"
              )}
            </div>
          </button>

          {/* ── Enhanced Desktop Dropdown ── */}
          {open && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-2 w-60 rounded-xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 overflow-hidden header-dropdown-enter"
            >
              {/* User card */}
              <div className="p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {renderAvatar("w-12 h-12 text-base")}
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full inline-block" />
                      Online
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1.5">
                <button
                  onClick={handleGoProfile}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex items-center gap-3 group"
                  role="menuitem"
                >
                  <Settings className="w-4.5 h-4.5 text-blue-500 group-hover:text-blue-600 transition-colors group-hover:rotate-90 duration-300" />
                  <span>Cài đặt tài khoản</span>
                </button>

                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 flex items-center gap-3 group"
                  role="menuitem"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-500 group-hover:text-red-600 transition-colors" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Mobile: Lang Toggle + Menu Button ── */}
        <div
          className="md:hidden flex items-center gap-2 flex-shrink-0 relative z-50"
          ref={mobileMenuRef}
        >
          <LanguageToggle />

          <button
            onClick={() => setMobileMenuOpen((v) => !v)}
            className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors focus:outline-none relative z-50 cursor-pointer border border-gray-200/50"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
            ) : (
              <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-gray-700" />
            )}
          </button>

          {/* ── Mobile Dropdown ── */}
          {mobileMenuOpen && (
            <div
              role="menu"
              className="fixed right-3 top-[56px] sm:top-[60px] w-72 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-white/95 backdrop-blur-xl shadow-2xl border border-gray-200/50 z-[60] overflow-hidden header-dropdown-enter"
            >
              {/* Mobile user card */}
              <div className="p-4 bg-gradient-to-r from-amber-50/80 to-orange-50/50 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  {renderAvatar("w-10 h-10 text-sm")}
                  <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate text-sm">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block" />
                      Online
                    </p>
                  </div>
                </div>
              </div>

              <div className="py-1.5">
                {/* Navigation Items */}
                {navItems.map((item) => (
                  <MobileMenuItem
                    key={item.to}
                    icon={item.icon}
                    label={item.label}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                  />
                ))}

                <div className="my-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />

                {/* Profile & Logout */}
                <button
                  onClick={handleGoProfile}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 flex items-center gap-3 group"
                  role="menuitem"
                >
                  <Settings className="w-4.5 h-4.5 text-blue-500 group-hover:text-blue-600 transition-colors" />
                  <span>Cài đặt tài khoản</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 transition-all duration-200 flex items-center gap-3 group"
                  role="menuitem"
                >
                  <LogOut className="w-4.5 h-4.5 text-red-500 group-hover:text-red-600 transition-colors" />
                  <span>Đăng xuất</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Slim progress bar (replaces full-screen overlay) ── */}
      {navLoading && (
        <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gray-100 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-400 via-amber-500 to-orange-500 w-1/3 rounded-full header-progress-bar" />
        </div>
      )}
    </header>
  );
};

// ── Desktop MenuItem ─────────────────────────────────────────
type MenuItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
};

const MenuItem = ({ icon: Icon, label, to }: MenuItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="group relative">
      <div
        className={`flex flex-col items-center justify-center px-2 py-1 lg:px-2.5 lg:py-1.5 rounded-xl cursor-pointer transition-all duration-300 min-w-[50px] ${
          isActive
            ? "bg-amber-50/80 shadow-sm border border-amber-200/50"
            : "hover:bg-white/60 hover:shadow-md hover:scale-105"
        }`}
      >
        <div className="relative">
          <div
            className={`absolute inset-0 rounded-lg blur-md transition-opacity duration-300 ${
              isActive
                ? "bg-gradient-to-r from-amber-400 to-orange-400 opacity-25"
                : "bg-gradient-to-r from-blue-400 to-purple-400 opacity-0 group-hover:opacity-30"
            }`}
          />
          <Icon
            className={`relative w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${
              isActive
                ? "text-amber-600 scale-110"
                : "text-gray-500 group-hover:text-blue-600 group-hover:scale-110"
            }`}
          />
        </div>
        <span
          className={`mt-0.5 text-[7.5px] md:text-[9px] font-semibold transition-colors duration-300 whitespace-nowrap text-center ${
            isActive
              ? "text-amber-700"
              : "text-gray-600 group-hover:text-blue-600"
          }`}
        >
          {label}
        </span>

        {/* Active indicator dot */}
        {isActive && (
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-5 h-1 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full" />
        )}
      </div>
    </Link>
  );
};

// ── Mobile MenuItem ──────────────────────────────────────────
type MobileMenuItemProps = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  to: string;
  onClick: () => void;
};

const MobileMenuItem = ({
  icon: Icon,
  label,
  to,
  onClick,
}: MobileMenuItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-all duration-200 flex items-center gap-3 group ${
        isActive
          ? "bg-amber-50 text-amber-700 border-l-3 border-amber-400"
          : "text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50"
      }`}
      role="menuitem"
    >
      <Icon
        className={`w-4.5 h-4.5 transition-all duration-300 ${
          isActive
            ? "text-amber-600"
            : "text-gray-400 group-hover:text-blue-600 group-hover:scale-110"
        }`}
      />
      <span>{label}</span>
      {isActive && (
        <span className="ml-auto w-1.5 h-1.5 bg-amber-500 rounded-full" />
      )}
    </Link>
  );
};

export default Header;
