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
    <div className="min-h-screen bg-[url('https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbg.366f773b.webp&w=1920&q=75')] bg-cover bg-center bg-gray-50/80">
      <div className="xl:w-[60%] min-h-screen mx-auto pt-6 relative bg-slate-50 min-h-[700px]">
        <div className="flex flex-col items-center justify-center gap-4 text-center p-6">
          <h2 className="text-yellow-500 font-semibold text-xl">
            {percent === 100 ? 'Tuyệt vời!' : 'Kết quả của bạn'}
          </h2>

          <div className="relative w-40 h-40">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
              />
              <path
                className="text-yellow-400"
                d="M18 2.5 a 15.5 15.5 0 0 1 0 31"
                fill="none"
                stroke="currentColor"
                strokeWidth="5"
                strokeDasharray={`${percent}, 100`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-orange-500 text-3xl font-bold">{percent}%</span>
            </div>
          </div>

          <p className="text-yellow-500 text-xl font-semibold">
            Bạn đã trả lời đúng {correctCount}/{total} câu
          </p>
        </div>

        <div className="bg-gray-100 rounded-lg shadow-md p-6 m-4 max-h-70 overflow-y-auto">
          {results.map((item, index) => (
            <div key={index} className="flex items-center justify-between border-b last:border-b-0 py-2">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon
                  icon={item.isCorrect ? faCheckCircle : faTimesCircle}
                  className={`text-xl ${item.isCorrect ? 'text-green-500' : 'text-red-500'}`}
                />
                <span className="text-lg font-medium">{item.word}</span>
              </div>
              <span className="text-sm text-gray-700 text-right max-w-[50%]">{item.meaning}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <button
            onClick={async () => {
              setIsLoading(true); // ✅ Hiển thị loading
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
            className="px-6 py-2 bg-yellow-400 text-white font-semibold rounded hover:bg-yellow-500 transition"
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
