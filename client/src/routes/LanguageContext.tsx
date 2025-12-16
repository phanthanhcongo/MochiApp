import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type Lang = 'jp' | 'en';

// Gọi API trực tiếp đến cổng 8000
const API_BASE = 'http://localhost:8000';

type Ctx = {
  lang: Lang | null;              // null khi đang tải
  setLang: (l: Lang) => void;     // set tạm ở client
  refresh: (opts?: { silent?: boolean }) => Promise<void>; // gọi lại API
};

const LanguageContext = createContext<Ctx | null>(null);

export function useLanguage(): Ctx {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage phải được dùng trong <LanguageProvider>');
  return ctx;
}

// Lấy lang từ server: GET /api/me/language => { language: 'jp' | 'en' }
async function fetchUserLanguage(signal?: AbortSignal): Promise<Lang> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}/api/me/language`, {
    credentials: 'include',
    method: 'GET',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Nếu server dùng cookie session như Sanctum, bật dòng sau
    // credentials: 'include',
    signal,
  });

  console.log('[language] status:', res.status);

  if (res.status === 401) {
    const body = await res.text().catch(() => '');
    console.warn('[language] 401 body:', body);
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[language] non ok:', res.status, body);
    throw new Error(body || `HTTP ${res.status}`);
  }

  const data = await res.json().catch(e => {
    console.error('[language] JSON parse error:', e);
    return {};
  });

  const raw = String((data as any).language ?? '').toLowerCase().trim();
  console.log('[language] raw from API:', raw);

  if (raw === 'en' || raw === 'jp') return raw as Lang;
  if (raw.startsWith('en')) return 'en';
  if (raw.startsWith('ja') || raw.startsWith('jp')) return 'jp';

  throw new Error(`Unsupported language value: "${raw}"`);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useMemo(
    () => async (opts?: { silent?: boolean }) => {
      // tránh đè request cũ
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!opts?.silent) setLoading(true);

      try {
        const l = await fetchUserLanguage(controller.signal);
        console.log('Ngôn ngữ từ server:', l);
        setLang(l);
      } catch (e: any) {
        if (e?.name === 'AbortError') {
          console.log('[language] request aborted');
          return;
        }
        // Với 401 hoặc lỗi khác, chọn fallback hợp lý
        // Có thể để null để UI loading quyết định
        // Ở đây fallback sang en để bảo đảm có giao diện
        console.error('[language] refresh error:', e);
        setLang('en');
      } finally {
        if (!opts?.silent) setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    void refresh();
    return () => {
      abortRef.current?.abort();
    };
  }, [refresh]);

  const value = useMemo(() => ({ lang, setLang, refresh }), [lang, refresh]);

  return (
    <LanguageContext.Provider value={value}>
      {loading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-md z-[9999]">
          <div className="relative">
            {/* Outer rotating circle */}
            <div className="animate-spin rounded-full h-24 w-24 border-4 border-transparent border-t-yellow-400 border-r-amber-500 border-b-orange-500 border-l-yellow-400"></div>
            {/* Inner counter-rotating circle for depth */}
            <div className="absolute top-0 left-0 h-24 w-24 rounded-full border-4 border-transparent border-t-yellow-200 border-r-amber-200 border-b-orange-200 border-l-yellow-200 opacity-50 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            {/* Center dot */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"></div>
          </div>
          <p className="mt-8 text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Đang tải...</p>
        </div>
      )}
      {children}
    </LanguageContext.Provider>
  );
}

