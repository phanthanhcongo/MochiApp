import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';
import { usePracticeSession } from '../utils/practiceStore';
import type { ReviewWord } from '../utils/practiceStore';


interface ReviewedWordLog {
  word: ReviewWord;
  firstFailed: boolean;
  reviewedAt: string;
}

const ResultProgress: React.FC = () => {
  const navigate = useNavigate();
  const [reviewedWords, setReviewedWords] = useState<ReviewedWordLog[]>([]);
  const [isLoading, setIsLoading] = useState(false); // ✅ Thêm state loading
  const { submitReviewedWords } = usePracticeSession();

  useEffect(() => {
    const raw = localStorage.getItem('reviewed_words_english');
    try {
      const parsed = raw ? JSON.parse(raw) : [];
      console.log('✅ Đọc reviewed_words_english từ localStorage:', parsed);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        navigate('/en/home');
      } else {
        setReviewedWords(parsed);
      }
    } catch (err) {
      console.error('❌ Lỗi khi đọc reviewed_words_english từ localStorage:', err);
      navigate('/en/home');
    }
  }, []);

  const results = reviewedWords.map(entry => ({
    word: entry.word.word,
    meaning: entry.word.meaning_vi,
    isCorrect: !entry.firstFailed,
  }));

  const correctCount = results.filter(item => item.isCorrect).length;
  const total = results.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;


  return (
    <div className="min-h-screen bg-[url('https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbg.366f773b.webp&w=1920&q=75')] bg-cover bg-center bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex flex-col items-center justify-center gap-2 text-center pt-8 pb-4 px-6">
          <h2 className="text-yellow-500 font-bold text-2xl uppercase tracking-wider">
            {percent === 100 ? 'Tuyệt vời!' : 'Kết quả của bạn'}
          </h2>

          <div className="relative w-32 h-32 my-2">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                className="text-gray-200"
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
              <circle
                className="text-yellow-400 transition-all duration-1000 ease-out"
                cx="18"
                cy="18"
                r="16"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeDasharray="100.5"
                strokeDashoffset={100.5 - percent}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-orange-500 text-3xl font-extrabold">{percent}%</span>
            </div>
          </div>

          <p className="text-gray-600 text-lg font-medium">
            Bạn đã trả lời đúng <span className="text-green-600 font-bold">{correctCount}</span> / <span className="font-bold">{total}</span> câu
          </p>
        </div>

        <div className="flex-1 px-6 py-2 overflow-hidden">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-inner p-4 max-h-[45vh] overflow-y-auto custom-scrollbar">
            {results.map((item, index) => (
              <div key={index} className="flex items-center justify-between border-b border-gray-50 last:border-b-0 py-3 hover:bg-gray-50 transition-colors px-2">
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon
                    icon={item.isCorrect ? faCheckCircle : faTimesCircle}
                    className={`text-xl ${item.isCorrect ? 'text-green-500' : 'text-red-500'}`}
                  />
                  <span className="text-lg font-semibold text-gray-800">{item.word}</span>
                </div>
                <span className="text-sm text-gray-500 text-right max-w-[60%] italic">{item.meaning}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 flex justify-center">
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                await submitReviewedWords();
                navigate('/en/home');
              } catch (err) {
                console.error('❌ Gửi dữ liệu thất bại:', err);
                alert('Có lỗi khi gửi kết quả, thử lại sau.');
              } finally {
                setIsLoading(false);
              }
            }}
            className="w-full max-w-xs py-3.5 bg-yellow-400 hover:bg-yellow-500 text-white font-bold text-lg rounded-2xl shadow-lg shadow-yellow-200 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            Về trang chủ
          </button>
        </div>
      </div>

      {/* ✅ Overlay Loading */}
      {isLoading && (
        <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm z-50">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-yellow-400 border-solid"></div>
          <p className="mt-4 text-lg text-gray-800">Đang xử lý...</p>
        </div>
      )}
    </div>
  );
};

export default ResultProgress;
