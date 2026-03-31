import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from './routes/LanguageContext';
import { getApiUrl } from './apiClient';

// Supported languages
const SUPPORTED = ['en', 'jp'] as const;
type Lang = typeof SUPPORTED[number];

// Type guards and helpers
const isLang = (v: unknown): v is Lang => typeof v === 'string' && (SUPPORTED as readonly string[]).includes(v);
const fromNavigator = (): Lang | null => {
  const nav = typeof navigator !== 'undefined' ? navigator.language?.toLowerCase() : '';
  if (nav.startsWith('ja')) return 'jp';
  if (nav.startsWith('en')) return 'en';
  return null;
};

// Try get lang from URL prefix: "/en/..." or "/jp/..."
const urlLangOf = (pathname: string): Lang | null => {
  const m = pathname.match(/^\/(en|jp)(\/|$)/);
  return m ? (m[1] as Lang) : null;
};

// Profile type
type Profile = {
  name: string;
  avatar_url?: string;
  target_language?: Lang;
};

const ProfileSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setLang: setGlobalLang, refresh } = useLanguage();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [lang, setLang] = useState<Lang | null>(null);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const token = localStorage.getItem('token');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Unified current language resolver. Order: state, URL, profile, localStorage, navigator, default "en".
  const resolvedLang: Lang = useMemo(() => {
    return (
      lang ||
      urlLangOf(location.pathname) ||
      (profile?.target_language && isLang(profile.target_language) ? profile.target_language : null) ||
      (isLang(localStorage.getItem('preferred_lang')) ? (localStorage.getItem('preferred_lang') as Lang) : null) ||
      fromNavigator() ||
      'en'
    );
  }, [lang, profile?.target_language, location.pathname]);

  // Path prefixer that respects existing prefixes and avoids login path
  const prefixPath = useMemo(() => {
    const alreadyPrefixed = (p: string) => /^\/(jp|en)(\/|$)/.test(p);
    return (path: string) => {
      let p = path.startsWith('/') ? path : `/${path}`;
      if (p.startsWith('/login')) return p;
      if (alreadyPrefixed(p)) return p;
      return `/${resolvedLang}${p}`;
    };
  }, [resolvedLang]);

  const navigateWithLang = (path: string, opts?: { replace?: boolean }) => {
    navigate(prefixPath(path), opts);
  };

  const authFetch = async (url: string, init?: RequestInit) => {
    const res = await fetch(url, {
      ...init,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(init?.headers || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      navigate('/login', { replace: true });
      throw new Error('Unauthorized');
    }
    return res;
  };

  // Initial data load. Do not force a language. Respect server value and URL.
  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    let aborted = false;
    authFetch(`${getApiUrl()}/me/language`)
      .then(r => r.json())
      .then((data) => {
        if (aborted) return;
        const serverLang: Lang | null = isLang(data.target_language) ? data.target_language : null;
        setProfile({ name: data.name, avatar_url: data.avatar_url, target_language: serverLang || undefined });

        // Only set state if not already chosen by URL
        const urlL = urlLangOf(location.pathname);
        const next = urlL || serverLang || (isLang(localStorage.getItem('preferred_lang')) ? (localStorage.getItem('preferred_lang') as Lang) : null) || fromNavigator() || null;
        if (next) {
          setLang(next);
          setGlobalLang(next);
        }
      })
      .catch(console.error);
    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Persist user choice locally for future sessions
  useEffect(() => {
    if (lang) localStorage.setItem('preferred_lang', lang);
  }, [lang]);

  // Handle avatar URL change
  const handleAvatarUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarUrl(e.target.value);
  };

  // Validate and preview avatar URL
  const handleAvatarUrlSubmit = () => {
    if (!avatarUrl.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập đường dẫn ảnh' });
      return;
    }

    // Basic URL validation
    try {
      new URL(avatarUrl);
      setShowAvatarModal(false);
      // Preview will be updated automatically via avatarUrl state
    } catch {
      setMessage({ type: 'error', text: 'Đường dẫn ảnh không hợp lệ. Vui lòng nhập URL đầy đủ (ví dụ: https://example.com/image.jpg)' });
    }
  };

  // Save profile (avatar and language) to server
  const saveProfile = async () => {
    if (!profile || !resolvedLang) return;
    setSaving(true);
    setMessage(null);

    try {
      let updatedAvatarUrl = profile.avatar_url;

      // Update avatar URL if there's a new one
      if (avatarUrl.trim() && avatarUrl !== profile.avatar_url) {
        const avatarRes = await authFetch(`${getApiUrl()}/me/avatar`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: avatarUrl.trim() }),
        });

        if (!avatarRes.ok) {
          const errorText = await avatarRes.text();
          throw new Error(errorText || 'Cập nhật avatar thất bại');
        }

        const avatarData = await avatarRes.json();
        updatedAvatarUrl = avatarData.avatar_url;
        setProfile(p => (p ? { ...p, avatar_url: updatedAvatarUrl } : p));
        setAvatarUrl('');

        // Dispatch event để Header cập nhật avatar
        window.dispatchEvent(new CustomEvent('avatar-updated', {
          detail: { avatar_url: updatedAvatarUrl }
        }));
      }

      // Save language
      const langRes = await authFetch(`${getApiUrl()}/me/language`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: resolvedLang }),
      });
      if (!langRes.ok) throw new Error(await langRes.text());

      setProfile(p => (p ? { ...p, target_language: resolvedLang, avatar_url: updatedAvatarUrl } : p));
      setGlobalLang(resolvedLang);
      refresh({ silent: true }).catch(() => { });

      // Redirect về trang home ngay lập tức
      navigateWithLang('/home');
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: e instanceof Error ? e.message : 'Lưu thất bại, vui lòng thử lại' });
    } finally {
      setSaving(false);
    }
  };

  if (!profile || !resolvedLang) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            {/* Rotating circle border only */}
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-yellow-400 border-r-amber-500 border-b-orange-500 border-l-yellow-400"></div>
          </div>
          <p className="mt-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Đang tải...</p>
        </div>
      </div>
    );
  }

  const langLabel = (v: Lang) => (v === 'jp' ? 'Tiếng Nhật' : 'Tiếng Anh');

  return (
    <div className="w-full min-h-screen max-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-lg flex-shrink-0">
        <div className="h-10 md:h-12 flex items-center justify-center px-3 md:px-6 relative">
          <button
            onClick={() => navigateWithLang('/home')}
            className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 text-white text-xl md:text-2xl font-bold hover:bg-white/20 w-6 h-6 md:w-8 md:h-8 flex items-center justify-center transition-all duration-200 active:scale-95 rounded-full"
            aria-label="Back"
          >
            ←
          </button>
          <h1 className="text-white font-bold text-xs md:text-sm tracking-tight drop-shadow-sm">
            Cài đặt tài khoản
          </h1>
        </div>
      </div>

      {/* Body */}
      <div className="p-2 flex flex-col items-center justify-center mx-auto flex-1 h-full overflow-y-auto w-full">
        {/* Profile Card */}
        <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-2 md:p-3 mb-2 transform transition-all duration-300 flex flex-col">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-3 md:mb-4">
            <div className="relative w-32 h-44 md:w-40 md:h-56">
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-lg blur-md opacity-50"></div>
              <img
                src={avatarUrl.trim() || profile.avatar_url || '/avatar.png'}
                alt="avatar"
                className="relative w-32 h-44 md:w-40 md:h-56 rounded-lg border-2 border-white object-cover shadow-md ring-2 ring-yellow-400/20"
                onError={(e) => {
                  // Fallback nếu ảnh không load được
                  (e.target as HTMLImageElement).src = '/avatar.png';
                }}
              />
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-3 h-3 md:w-4 md:h-4 border-2 border-white shadow-sm"></div>
            </div>

            {/* Change Avatar Button */}
            <div className="mt-3 md:mt-4 flex flex-col items-center">
              <button
                onClick={() => {
                  setAvatarUrl(profile.avatar_url || '');
                  setShowAvatarModal(true);
                }}
                className="px-2 py-1.5 md:px-3 md:py-2 rounded-lg bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold text-[10px] md:text-xs shadow-md hover:shadow-lg transform transition-all duration-200 active:scale-95 cursor-pointer flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="hidden sm:inline">Thay ảnh đại diện</span>
                <span className="sm:hidden">Thay ảnh</span>
              </button>
              {avatarUrl.trim() && avatarUrl !== profile.avatar_url && (
                <p className="mt-2 md:mt-2 text-sm md:text-base text-green-600 font-medium text-center px-2">✓ Đã nhập URL mới, nhấn "Lưu thay đổi" để cập nhật</p>
              )}
            </div>

            <h2 className="mt-1 text-base md:text-lg font-bold text-gray-800 tracking-tight">{profile.name}</h2>
            <p className="text-[10px] md:text-xs text-gray-500">Hồ sơ cá nhân</p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1.5 md:my-2"></div>

          {/* Language picker */}
          <div className="w-full">
            <div className="text-gray-800 font-semibold m-1 md:m-1.5 text-[10px] md:text-sm flex items-center gap-1">
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
              </svg>
              Ngôn ngữ học tập
            </div>

            <div className="flex gap-1.5 md:gap-2 m-1 md:m-1.5">
              <button
                type="button"
                onClick={() => setLang('jp')}
                className={`flex-1 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border-2 transition-all duration-200 transform active:scale-95 font-semibold text-[10px] md:text-xs ${resolvedLang === 'jp'
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-500 shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-yellow-300'
                  }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs md:text-sm">🇯🇵</span>
                  <span>Tiếng Nhật</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`flex-1 px-2 py-1 md:px-3 md:py-1.5 rounded-lg border-2 transition-all duration-200 transform active:scale-95 font-semibold text-[10px] md:text-xs ${resolvedLang === 'en'
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500 text-white border-yellow-500 shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-200 hover:border-yellow-300'
                  }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span className="text-xs md:text-sm">🇬🇧</span>
                  <span>Tiếng Anh</span>
                </div>
              </button>
            </div>

            <div className="m-1 md:m-1.5 p-1 bg-gray-50 rounded border border-gray-200">
              <div className="text-[9px] md:text-[10px] text-gray-600 flex items-center gap-1">
                <svg className="w-2.5 h-2.5 md:w-3 md:h-3 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Đang chọn: <span className="font-bold text-yellow-700">{langLabel(resolvedLang)}</span></span>
              </div>
            </div>

            {/* Save Button */}
            <div className="m-1 md:m-1.5">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="w-full px-4 py-1.5 md:px-5 md:py-2 rounded-full bg-gradient-to-r from-gray-900 via-gray-800 to-black hover:from-black hover:via-gray-900 hover:to-gray-800 text-white font-bold text-[10px] md:text-sm shadow-md transition-all duration-200 active:scale-95 flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <svg className="animate-spin h-4 w-4 md:h-5 md:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>

              {message && (
                <div
                  className={`mt-2 md:mt-4 p-2 md:p-4 rounded-lg md:rounded-xl border-2 flex items-center gap-2 md:gap-3 animate-in slide-in-from-top-2 duration-300 ${message.type === 'success'
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                    }`}
                >
                  {message.type === 'success' ? (
                    <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                  <p className="text-xs md:text-sm font-medium">{message.text}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Avatar URL Modal */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 md:p-4" onClick={() => setShowAvatarModal(false)}>
          <div className="bg-white rounded-xl md:rounded-2xl shadow-2xl max-w-md w-full p-4 md:p-6 transform transition-all" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">Nhập đường dẫn ảnh đại diện</h3>

            <div className="mb-3 md:mb-4">
              <label className="block text-xs md:text-sm font-medium text-gray-700 mb-2">
                URL ảnh (ví dụ: https://example.com/image.jpg)
              </label>
              <input
                type="url"
                value={avatarUrl}
                onChange={handleAvatarUrlChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 md:px-4 md:py-3 border-2 border-gray-300 rounded-lg md:rounded-xl focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 outline-none transition-all text-sm md:text-base"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAvatarUrlSubmit();
                  }
                  if (e.key === 'Escape') {
                    setShowAvatarModal(false);
                  }
                }}
                autoFocus
              />
              {avatarUrl.trim() && (
                <div className="mt-2 md:mt-3 p-2 md:p-3 bg-gray-50 rounded-lg md:rounded-xl border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Xem trước:</p>
                  <img
                    src={avatarUrl.trim()}
                    alt="Preview"
                    className="w-full h-24 md:h-32 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-2 md:gap-3">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="flex-1 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl border-2 border-gray-300 text-gray-700 font-semibold text-sm md:text-base hover:bg-gray-50 transition-all"
              >
                Hủy
              </button>
              <button
                onClick={handleAvatarUrlSubmit}
                className="flex-1 px-3 py-2 md:px-4 md:py-3 rounded-lg md:rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-semibold text-sm md:text-base shadow-lg hover:shadow-xl transform transition-all active:scale-95"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
