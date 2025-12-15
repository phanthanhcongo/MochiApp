import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-600 mb-4">Trang không tìm thấy</h2>
        <p className="text-gray-500 mb-8">Trang bạn đang tìm kiếm không tồn tại.</p>
        <Link
          to="/login"
          className="inline-block px-6 py-3 bg-yellow-400 text-gray-800 font-semibold rounded-lg hover:bg-yellow-500 transition-colors"
        >
          Về trang đăng nhập
        </Link>
      </div>
    </div>
  );
}

