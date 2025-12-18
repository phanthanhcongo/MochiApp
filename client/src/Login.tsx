import React, { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from './routes/LanguageContext';

type Lang = 'jp' | 'en';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { setLang, refresh } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true); // kiểm tra token sẵn có
  const [err, setErr] = useState<string | null>(null);

  const fetchLangPrefix = async (token: string): Promise<Lang | null> => {
    try {
      const res = await fetch('http://localhost:8000/api/me/language', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (!res.ok) return null;
      const data = await res.json().catch(() => ({}));
      // FIX: server trả "language", không phải "target_language"
      const raw = String(data?.language ?? '').toLowerCase();
      if (raw.startsWith('en')) return 'en';
      if (raw.startsWith('ja') || raw.startsWith('jp')) return 'jp';
      return null;
    } catch {
      return null;
    }
  };

  // Auto redirect nếu đã có token
  useEffect(() => {
    const bootstrap = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setChecking(false);
        return;
      }
      const lang = await fetchLangPrefix(token);
      if (lang) {
        // Set language vào context, refresh context, đợi một chút rồi mới navigate
        setLang(lang);
        await refresh({ silent: true });
        // Đợi một chút để đảm bảo context đã cập nhật
        await new Promise(resolve => setTimeout(resolve, 100));
        navigate(`/${lang}/home`, { replace: true });
      } else {
        // token không hợp lệ -> dọn và ở lại login
        localStorage.removeItem('token');
        setChecking(false);
      }
    };
    void bootstrap();
  }, [navigate, setLang, refresh]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email || !password) {
      setErr('Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Đăng nhập thất bại');

      const token: string = data.token;
      localStorage.setItem('token', token);

      const lang = await fetchLangPrefix(token);
      if (lang) {
        // Dùng window.location.href để force reload, đảm bảo LanguageContext khởi tạo lại
        window.location.href = `/${lang}/home`;
      } else {
        setErr('Không lấy được ngôn ngữ người dùng.');
      }
    } catch (e: any) {
      setErr(e?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị loading screen đẹp hơn
  if (checking) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-yellow-400 border-r-amber-500 border-b-orange-500 border-l-yellow-400"></div>
          </div>
          <p className="mt-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Đang kiểm tra phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Header vàng */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-lg">
        <div className="h-20 flex items-center justify-center px-6 relative">
          <h1 className="text-white font-bold text-xl md:text-2xl tracking-tight drop-shadow-sm">
            Đăng nhập
          </h1>
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 md:p-14 transform transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-800 mb-3 tracking-tight">Chào mừng trở lại!</h2>
            <p className="text-lg text-gray-500 font-medium">Tiếp tục hành trình học tập của bạn</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-8">
            {/* Email/Username */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-3 ml-1">Tên đăng nhập / Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập tên đăng nhập hoặc email"
                  className="w-full h-16 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-800 pl-14 pr-4 text-lg outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-sm"
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password + Hiển thị */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-3 ml-1">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-16 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-800 pl-14 pr-24 text-lg outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-sm"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-600 font-bold flex items-center gap-2 text-base transition-colors"
                >
                  {showPw ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  <span>{showPw ? 'Ẩn' : 'Hiện'}</span>
                </button>
              </div>
            </div>

            {err && (
              <div className="flex items-center gap-4 p-5 bg-red-50 border-2 border-red-100 rounded-2xl text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
                <svg className="h-6 w-6 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-base font-bold">{err}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-16 rounded-full bg-gradient-to-r from-gray-900 via-gray-800 to-black hover:from-black hover:via-gray-900 hover:to-gray-800 text-white font-black text-xl shadow-xl hover:shadow-2xl transform transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none active:scale-95 flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                <>
                  <span>Đăng nhập ngay</span>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Link phụ */}
          <div className="mt-10 pt-8 border-t border-gray-100">
            <div className="flex flex-col items-center gap-5">
              <a href="/forgot" className="text-base text-gray-500 font-medium hover:text-yellow-600 transition-colors">
                Bạn quên mật khẩu?
              </a>
              <p className="text-gray-600 text-base font-medium">
                Chưa có tài khoản?{' '}
                <a href="/register" className="text-yellow-600 font-extrabold text-lg hover:text-yellow-700 transition-colors ml-1">
                  Tạo tài khoản mới
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
