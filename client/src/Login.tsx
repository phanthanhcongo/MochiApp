import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Lang = 'jp' | 'en';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
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
        // nếu bạn dùng cookie session (Sanctum), bật dòng sau
        // credentials: 'include',
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
        navigate(`/${lang}/home`, { replace: true });
      } else {
        // token không hợp lệ -> dọn và ở lại login
        localStorage.removeItem('token');
        setChecking(false);
      }
    };
    void bootstrap();
  }, [navigate]);

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
        // nếu login bằng email thì đổi key tương ứng
        body: JSON.stringify({ name: email, password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || 'Đăng nhập thất bại');

      const token: string = data.token;
      localStorage.setItem('token', token);

      const lang = await fetchLangPrefix(token);
      if (lang) {
        navigate(`/${lang}/home`, { replace: true });
      } else {
        setErr('Không lấy được ngôn ngữ người dùng.');
      }
    } catch (e: any) {
      setErr(e?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị “đang kiểm tra” khi đang auto-login
  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Đang kiểm tra phiên đăng nhập…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header vàng + nút đóng */}
      <div className="sticky top-0 z-10 bg-yellow-400 text-center font-bold text-[28px] py-3 rounded-b-2xl shadow-sm">
        <div className="mx-auto max-w-4xl relative">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-yellow-300 hover:bg-yellow-200"
            aria-label="Đóng"
            title="Đóng"
          >
            <X className="h-5 w-5 text-gray-800" />
          </button>
          Đăng nhập
        </div>
      </div>

      {/* Nội dung */}
      <div className="flex items-center justify-center min-h-[calc(100vh-60px)] w-full">
        <div className="w-full max-w-xl">
          <form onSubmit={onSubmit} className="space-y-5">
            {/* Email/Username */}
            <div>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="thanhcongpoki@gmail.com"
                className="w-full h-14 rounded-2xl bg-[#eaf1ff] text-gray-800 px-5 outline-none border-0 focus:ring-2 focus:ring-blue-400"
                autoComplete="username"
              />
            </div>

            {/* Password + Hiển thị */}
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 rounded-2xl bg-[#eaf1ff] text-gray-800 px-5 pr-24 outline-none border-0 focus:ring-2 focus:ring-blue-400"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-green-700 font-semibold flex items-center gap-1"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                <span>{showPw ? 'Ẩn' : 'Hiển thị'}</span>
              </button>
            </div>

            {err && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                {err}
              </div>
            )}

            {/* Button xanh lá gradient */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-12 rounded-full text-slate-50 font-bold shadow
                bg-gradient-to-b from-green-400 to-green-600
                hover:from-green-500 hover:to-green-700
                disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
            </button>
          </form>

          {/* Link phụ */}
          <div className="text-center mt-6 text-[15px]">
            <a href="/forgot" className="text-blue-600 hover:underline">
              Quên mật khẩu?
            </a>
            <div className="mt-3 text-gray-600">
              Chưa có tài khoản?
              <a href="/register" className="text-blue-600 font-semibold hover:underline ml-1">
                Tạo tài khoản học mới
              </a>
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
