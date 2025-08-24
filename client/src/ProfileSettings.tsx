import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from './router/LanguageContext';

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
    authFetch('http://localhost:8000/api/me/language')
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

  // Save language to server
  const saveLanguage = async () => {
    if (!profile || !resolvedLang) return;
    setSaving(true);
    setMessage(null);

    try {
      const res = await authFetch('http://localhost:8000/api/me/language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: resolvedLang }),
      });
      if (!res.ok) throw new Error(await res.text());

      setProfile(p => (p ? { ...p, target_language: resolvedLang } : p));
      setGlobalLang(resolvedLang);
      setMessage({ type: 'success', text: 'Đã lưu ngôn ngữ muốn học' });

      navigateWithLang('/home', { replace: true });
      refresh({ silent: true }).catch(() => {});
    } catch (e) {
      console.error(e);
      setMessage({ type: 'error', text: 'Lưu thất bại, vui lòng thử lại' });
    } finally {
      setSaving(false);
    }
  };

  if (!profile || !resolvedLang) return <div className="p-6">Đang tải...</div>;

  const langLabel = (v: Lang) => (v === 'jp' ? 'Tiếng Nhật' : 'Tiếng Anh');

  return (
    <div className="w-full min-h-screen bg-stone-50 shadow overflow-hidden">
      {/* Header */}
      <div className="bg-yellow-400 h-16 flex items-center justify-between px-4">
        <button
          onClick={() => navigateWithLang('/home')}
          className="text-stone-50 text-xl font-bold hover:opacity-80"
        >
          ←
        </button>
        <h1 className="text-black font-semibold text-lg">Cài đặt tài khoản</h1>
        <div className="w-6" />
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col items-center">
        <img
          src={profile.avatar_url || '/avatar.png'}
          alt="avatar"
          className="w-24 h-24 rounded-full border-4 border-yellow-400 object-cover"
        />
        <h2 className="mt-4 text-xl font-bold">{profile.name}</h2>

        {/* Language picker */}
        <div className="mt-6 w-full max-w-md">
          <div className="text-gray-700 font-medium mb-2">Ngôn ngữ muốn học</div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setLang('jp')}
              className={`flex-1 px-4 py-2 rounded-xl border transition ${
                resolvedLang === 'jp'
                  ? 'bg-yellow-400 text-stone-50 border-yellow-400'
                  : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Tiếng Nhật
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`flex-1 px-4 py-2 rounded-xl border transition ${
                resolvedLang === 'en'
                  ? 'bg-yellow-400 text-stone-50 border-yellow-400'
                  : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-300'
              }`}
            >
              Tiếng Anh
            </button>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            Đang chọn: <span className="font-semibold">{langLabel(resolvedLang)}</span>
          </div>

          <div className="mt-6">
            <button
              onClick={saveLanguage}
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white font-semibold disabled:opacity-60"
            >
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>

            {message && (
              <p
                className={`mt-2 text-sm ${
                  message.type === 'success' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {message.text}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
