import React, { useState } from 'react';
import { Eye, EyeOff, User, Mail, Lock, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from './apiClient';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Validation helpers
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateName = (name: string): { valid: boolean; error?: string } => {
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      return { valid: false, error: 'Tên đăng nhập không được để trống.' };
    }
    
    if (trimmedName.length < 3) {
      return { valid: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự.' };
    }
    
    if (trimmedName.length > 50) {
      return { valid: false, error: 'Tên đăng nhập không được vượt quá 50 ký tự.' };
    }
    
    // Allow alphanumeric, underscores, and hyphens
    const nameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!nameRegex.test(trimmedName)) {
      return { valid: false, error: 'Tên đăng nhập chỉ được chứa chữ cái, số, dấu gạch dưới và dấu gạch ngang.' };
    }
    
    return { valid: true };
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    // Trim all inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    // Validate required fields
    if (!trimmedName || !trimmedPassword || !trimmedConfirmPassword) {
      setErr('Vui lòng nhập đầy đủ các trường bắt buộc.');
      return;
    }

    // Validate name format and length
    const nameValidation = validateName(trimmedName);
    if (!nameValidation.valid) {
      setErr(nameValidation.error || 'Tên đăng nhập không hợp lệ.');
      return;
    }

    // Validate email format if provided
    if (trimmedEmail && !validateEmail(trimmedEmail)) {
      setErr('Email không đúng định dạng.');
      return;
    }

    // Validate password length
    if (trimmedPassword.length < 6) {
      setErr('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    // Validate password match
    if (trimmedPassword !== trimmedConfirmPassword) {
      setErr('Mật khẩu xác nhận không khớp.');
      return;
    }

    setLoading(true);
    try {
      // Prepare request body - only include email if it's valid
      const requestBody: { name: string; password: string; email?: string } = {
        name: trimmedName,
        password: trimmedPassword,
      };
      
      // Only include email if it has a value and is valid
      if (trimmedEmail && validateEmail(trimmedEmail)) {
        requestBody.email = trimmedEmail;
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(requestBody),
      });

      let data: any = {};
      try {
        data = await res.json();
      } catch (parseError) {
        // If response is not JSON, handle as network/parse error
        if (!res.ok) {
          throw new Error('Không thể kết nối đến server. Vui lòng thử lại sau.');
        }
      }

      if (!res.ok) {
        // Handle Laravel validation errors (422 status)
        if (res.status === 422 && data.errors) {
          // Extract first error message from each field
          const errorMessages: string[] = [];
          Object.keys(data.errors).forEach((field) => {
            if (Array.isArray(data.errors[field]) && data.errors[field].length > 0) {
              errorMessages.push(data.errors[field][0]);
            }
          });
          throw new Error(errorMessages.join(' ') || data.message || 'Dữ liệu không hợp lệ.');
        }
        
        // Handle other error responses
        throw new Error(data?.message || 'Đăng ký thất bại');
      }

      // Đăng ký thành công, lưu token và chuyển đến trang chọn ngôn ngữ hoặc home
      const token: string = data.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      
      navigate('/login'); 
    } catch (e: any) {
      // Handle network errors
      if (e instanceof TypeError && e.message.includes('fetch')) {
        setErr('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else {
        setErr(e?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 shadow-lg">
        <div className="h-20 flex items-center justify-center px-6 relative">
          <h1 className="text-white font-bold text-xl md:text-2xl tracking-tight drop-shadow-sm">
            Tạo tài khoản mới
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="w-full max-w-2xl bg-white rounded-[40px] shadow-2xl p-10 md:p-14 transform transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-800 mb-3 tracking-tight">Bắt đầu ngay!</h2>
            <p className="text-lg text-gray-500 font-medium">Tham gia cộng đồng học tập của chúng tôi</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Username */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-3 ml-1">Tên đăng nhập <span className="text-red-500">*</span></label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <User className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên đăng nhập của bạn"
                  className="w-full h-16 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-800 pl-14 pr-4 text-lg outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-base font-bold text-gray-700 mb-3 ml-1">Email (Không bắt buộc)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <Mail className="h-6 w-6 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vidu@gmail.com"
                  className="w-full h-16 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-800 pl-14 pr-4 text-lg outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-3 ml-1">Mật khẩu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-16 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-800 pl-14 pr-4 text-lg outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-sm"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-gray-700 mb-3 ml-1">Xác nhận mật khẩu <span className="text-red-500">*</span></label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Lock className="h-6 w-6 text-gray-400" />
                  </div>
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-16 rounded-2xl bg-gray-50 border-2 border-gray-100 text-gray-800 pl-14 pr-4 text-lg outline-none focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/10 transition-all shadow-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-600 transition-colors"
                  >
                    {showPw ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                  </button>
                </div>
              </div>
            </div>

            {err && (
              <div className="flex items-center gap-4 p-5 bg-red-50 border-2 border-red-100 rounded-2xl text-red-700 animate-in fade-in slide-in-from-top-2 duration-300">
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
                  <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full"></div>
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>Đăng ký ngay</span>
                  <ArrowRight className="w-6 h-6" strokeWidth={3} />
                </>
              )}
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-10 pt-8 border-t border-gray-100 text-center">
            <p className="text-gray-600 text-base font-medium">
              Đã có tài khoản?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-yellow-600 font-extrabold text-lg hover:text-yellow-700 transition-colors ml-1"
              >
                Đăng nhập tại đây
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

