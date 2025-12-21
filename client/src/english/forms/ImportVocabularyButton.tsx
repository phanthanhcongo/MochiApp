import { useRef, useState, type ChangeEvent } from 'react';
import { BiLogOutCircle, BiCodeBlock } from 'react-icons/bi';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../../apiClient';

const ImportVocabularyButton = () => {
  const [jsonText, setJsonText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // input file ẩn để chọn file JSON rồi dán vào textarea
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handlePickFile = () => {
    setMessage(null);
    setError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    setMessage(null);
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      // Thử parse để chắc là JSON, sau đó pretty-print vào textarea
      const pretty = JSON.stringify(JSON.parse(text), null, 2);
      setJsonText(pretty);
    } catch {
      setError('File không phải JSON hợp lệ.');
    } finally {
      // Cho phép chọn lại cùng file nếu cần
      e.target.value = '';
    }
  };

const handleImport = async () => {
  setLoading(true);
  setMessage(null);
  setError(null);

  // 1) Parse JSON đầu vào
  let payload: any;
  try {
    if (!jsonText.trim()) throw new Error('Vui lòng dán JSON vào trước khi import.');
    payload = JSON.parse(jsonText);
  } catch (e: any) {
    setLoading(false);
    setError(`JSON không hợp lệ: ${e.message}`);
    return;
  }

  try {
    const token = localStorage.getItem('token');

    const res = await fetch(`${API_URL}/en/vocabulary/import`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    // 2) Đọc raw text trước, rồi mới thử parse JSON
    const raw = await res.text();
    let data: any = null;
    if (raw) {
      try {
        data = JSON.parse(raw);
      } catch {
        // không phải JSON, giữ nguyên raw
      }
    }

    // Helper: lấy danh sách duplicates (nếu có)
    const dupList: string[] = Array.isArray(data?.duplicates) ? data.duplicates : [];

    // 3) Trường hợp lỗi HTTP
    if (!res.ok) {
      // Nếu backend trả về duplicates kèm error -> hiển thị rõ ràng
      if (dupList.length > 0) {
        const errMsg = `${data?.error || data?.message || `HTTP ${res.status}`}\nCác từ trùng: ${dupList.join(', ')}`;
        throw new Error(errMsg);
      }
      // Fallback
      const msg = data?.message || data?.error || (raw || `HTTP ${res.status}`);
      throw new Error(msg);
    }

    // 4) Thành công: có thể có duplicates (partial success)
    // Ưu tiên message từ server, fallback sang raw hoặc default
    let msg = data?.message || (raw || '').trim() || 'Import thành công.';

    // Nếu server trả về danh sách items đã commit, có thể thêm số lượng
    const committedCount = Array.isArray(data?.items) ? data.items.length : undefined;
    if (typeof committedCount === 'number') {
      msg += `\nĐã thêm: ${committedCount} từ.`;
    }

    // Thêm thông báo các từ trùng (nếu có)
    if (dupList.length > 0) {
      msg += `\nCác từ trùng bị bỏ qua: ${dupList.join(', ')}`;
    }

    setMessage(msg);
  } catch (err: any) {
    setError(err.message || 'Lỗi không xác định');
  } finally {
    setLoading(false);
  }
};



  const handleFormat = () => {
    try {
      const pretty = JSON.stringify(JSON.parse(jsonText || '{}'), null, 2);
      setJsonText(pretty);
      setError(null);
    } catch {
      setError('Không thể format do JSON không hợp lệ.');
    }
  };

  return (
    <div className="p-4 min-h-screen mx-auto">
      {/* Tiêu đề + nút Back Home + User Mode */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/en/home')}
            className="flex items-center text-gray-700 hover:text-gray-900 cursor-pointer"
          >
            <BiLogOutCircle className="text-gray-700 text-3xl" />
            <span className="ml-2 text-sm">Quay lại</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/en/add')}
            className="flex items-center text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            <BiCodeBlock className="text-blue-600 text-3xl" />
            <span className="ml-2 text-sm">User Mode</span>
          </button>
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-3">Import từ vựng bằng JSON</h2>

      {/* Nút chọn file JSON để dán nội dung vào textarea (UI giữ nguyên, chỉ thêm nút) */}
      <div className="mb-3">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={handlePickFile}
          className="px-3 py-2 text-sm border bg-emerald-300 rounded hover:bg-emerald-500"
          disabled={loading}
        >
          Chọn file JSON và dán vào ô dưới
        </button>
      </div>

      <label className="block text-sm text-gray-600 mb-2">
        Dán JSON của bạn vào đây chỉ nên dưới 1000 từ vựng để tránh timeout
      </label>
      <textarea
        value={jsonText}
        onChange={(e) => setJsonText(e.target.value)}
        rows={12}
        className="w-full font-mono text-sm p-3 border rounded outline-none focus:ring-2 focus:ring-blue-500"
        placeholder='Ví dụ: [{ "kanji": "猫", "reading_hiragana": "ねこ", "reading_romaji": "neko", "meaning_vi": "con mèo", "han_viet": "Miêu", "explanation": "..." }]'
      />

      <div className="flex items-center justify-between mt-3">
        <div className="text-xs text-gray-500">
          {jsonText ? `${jsonText.length} ký tự` : 'Chưa có dữ liệu'}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleFormat}
            className="px-3 py-2 text-sm border rounded hover:bg-gray-50"
            disabled={!jsonText || loading}
          >
            Format JSON
          </button>
          <button
            onClick={handleImport}
            disabled={loading || !jsonText}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-md shadow"
          >
            {loading ? 'Đang import...' : 'Import JSON'}
          </button>
        </div>
      </div>

      {message && <p className="mt-4 text-green-600">{message}</p>}
      {error && <p className="mt-4 text-red-500">{error}</p>}
    </div>
  );
};

export default ImportVocabularyButton;
