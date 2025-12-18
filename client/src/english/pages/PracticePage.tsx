import  { useEffect, useState } from 'react';
import { usePracticeSession } from '../utils/practiceStore';
import type { ReviewWord } from '../utils/practiceStore';
import { useNavigate } from 'react-router-dom';
import Header from '../../japanese/components/Header';

interface ReviewStat {
  level: number;
  count: number;
  color: string;
}



const PracticePage = () => {
  const [reviewStats, setReviewStats] = useState<ReviewStat[]>([]);
  const [totalWords, setTotalWords] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [reviewWordsCount, setReviewWordsCount] = useState<number>(0);
  const [wordsToReview, setWordsToReview] = useState<ReviewWord[]>([]);
  const [nextReviewIn, setNextReviewIn] = useState<string | null>(null);
  const { setWords, getNextQuizType } = usePracticeSession();
  const navigate = useNavigate();
// localStorage.setItem('user_id', '2');


useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return; // hoặc điều hướng về /login

  // Kiểm tra nếu có phiên ôn tập chưa hoàn thành
  const storedRaw = localStorage.getItem('reviewed_words_english');
  const reviewedWords = storedRaw ? JSON.parse(storedRaw) : [];
  if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
    navigate('/en/summary');
    return;
  }

  fetch('http://localhost:8000/api/en/practice/stats', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  })
    .then(async (res) => {
      if (res.status === 401) {
        // token hết hạn/không hợp lệ
        localStorage.removeItem('token');
        window.location.replace('/login');
        return Promise.reject(new Error('Unauthorized'));
      }
      return res.json();
    })

    .then((data) => {
      // console.log('📊 Dữ liệu thống kê:', data);
      setReviewStats(data.reviewStats || []);
      setTotalWords(data.totalWords || 0);
      setReviewWordsCount(data.wordsToReview || 0);
      setStreak(data.streak || 0);
      setWordsToReview(data.reviewWords || []);
      setNextReviewIn(data.nextReviewIn || null);
    })
    .catch((err) => console.error('Fetch stats error:', err));

  sessionStorage.setItem('reload_count', '0');
}, []);


  sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước


const handleStartPractice = () => {
  const preparedWords: ReviewWord[] = wordsToReview.map((w: any): ReviewWord => {

    return {
      id: w.id,
      user_id: w.user_id,
      word: w.word,
      ipa: w.ipa ?? undefined,
      meaning_vi: w.meaning_vi ?? '',
      cefr_level: w.cefr_level ?? undefined,
      level: w.level ?? undefined,
      last_reviewed_at: w.last_reviewed_at ?? undefined,
      next_review_at: w.next_review_at ?? undefined,

      // 1 ngữ cảnh đầu tiên nếu có, else rỗng
      context_vi: w.contexts?.[0]?.context_vi ?? '',

      // ví dụ hiển thị nhanh ở cấp word
      exampleEn: w.exampleEn ?? '',
      exampleVi: w.exampleVn ?? '',

      // danh sách examples + exercises cho fill-in-blank
      examples: (w.examples ?? []).map((ex: any) => ({
        id: ex.id,
        en_word_id: ex.en_word_id,
        sentence_en: ex.sentence_en,
        sentence_vi: ex.sentence_vi ?? '',
        exercises: (ex.exercises ?? []).map((exer: any) => ({
          id: exer.id,
          example_id: exer.example_id,
          question_text: exer.question_text ?? '',
          blank_position:
            typeof exer.blank_position === 'number' ? exer.blank_position : 0,
          answer_explanation: exer.answer_explanation ?? undefined,
          choices: (exer.choices ?? []).map((ch: any) => ({
            id: ch.id,
            content: ch.content,
            is_correct: Number(ch.is_correct) as 0 | 1,
          })),
        })),
      })),
    };
  });

  setWords(preparedWords);

  setTimeout(() => {
    const storedWords = usePracticeSession.getState().words;
    console.log('📦 Dữ liệu đã lưu trong store:', storedWords);
  }, 0);

  const firstQuizType = getNextQuizType();
  console.log('🚀 Bắt đầu với quiz type:', firstQuizType);
  navigate(`/en/quiz/${firstQuizType}`, { state: { from: firstQuizType } });
};




  return (
    <div>
      {/* Invisible classes to force Tailwind build colors */}
<div className="hidden">
  bg-red-400 bg-fuchsia-300 bg-yellow-400 bg-green-400 bg-sky-400 bg-indigo-500 bg-purple-600 bg-gray-400
</div>

      <Header />
      <div className="bg-[url('https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbg.366f773b.webp&w=1920&q=75')] bg-cover bg-center
      flex min-h-screen bg-gray-200 text-sm sm:text-base md:text-lg">

  {/* Left Column */}
  <div className="hidden xl:block w-2/10"></div>

  {/* Center Column */}
  <div className="w-full xl:w-6/10 flex-1 flex flex-col items-center justify-start pt-20 sm:pt-12 md:pt-16 pb-6 sm:pb-8 md:pb-12 px-3 sm:px-4 md:px-6 bg-slate-50 shadow-md mx-auto">
    
    {/* Top summary */}
    <div className="flex items-center space-x-2 sm:space-x-3 mb-4 sm:mb-6">
      <div className="w-10 h-10 sm:w-12 sm:h-14 rounded-full bg-slate-50 border border-gray-300 border-b-4 sm:border-b-8 shadow-inner flex items-center justify-center">
        <img
          src="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon_notebook.cd7f4676.png&w=256&q=75"
          alt="Notebook icon"
          className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8"
        />
      </div>
      <p className="text-gray-700 text-sm sm:text-base md:text-lg">
        Bạn đã học được <span className="font-bold">{totalWords} từ</span>
      </p>
    </div>

    {/* Bar Chart */}
    <div className="relative w-full pt-5 max-w-3xl mb-4 sm:mb-6">
      <div className="flex justify-center items-end space-x-2 sm:space-x-4 md:space-x-6 lg:space-x-8 h-60 sm:h-80 md:h-90 pb-6 sm:pb-8 md:pb-10 overflow-x-auto">
        {reviewStats.map((item) => (
          <div key={item.level} className="flex flex-col items-center flex-shrink-0">
            <div className="text-xs sm:text-sm md:text-base font-semibold mb-1">{item.count} từ</div>
            <div
              className={`${item.color} w-8 sm:w-10 md:w-12 lg:w-14 rounded-t-md`}
              style={{ height: `${Math.min(item.count / 20 + 20, 180)}px` }}
            />
            <div className="mt-2 sm:mt-3 text-base sm:text-lg md:text-xl font-bold text-black">{item.level}</div>
          </div>
        ))}
      </div>
      <div className="absolute left-0 right-0 bottom-12 sm:bottom-16 md:bottom-20 h-[6px] sm:h-[8px] bg-gray-300 rounded-full mx-auto max-w-[60%]" />
    </div>

    {/* Ready to review */}
    <div className="text-gray-800 text-base sm:text-lg md:text-xl mb-4 sm:mb-6 text-center">
      Chuẩn bị ôn tập: <span className="font-bold text-red-500">{reviewWordsCount} từ</span>
    </div>

    <button
      onClick={handleStartPractice}
      className="mb-6 sm:mb-8 md:mb-10 h-12 sm:h-14 md:h-15 w-full sm:w-64 md:w-60 text-slate-50 font-bold text-base sm:text-lg md:text-xl font-medium px-6 sm:px-8 py-2.5 sm:py-3 rounded-full shadow-md bg-gradient-to-r from-lime-400 to-green-600 hover:brightness-110 transition disabled:opacity-50 disabled:cursor-not-allowed"
      disabled={reviewWordsCount === 0}
    >
      {reviewWordsCount > 0 ? 'Ôn tập ngay' : `⏳ ${nextReviewIn ?? 'Đang chờ...'}`}
    </button>
  </div>

  {/* Right Column */}
  <div className="hidden xl:flex w-2/10 flex-col items-center px-4 space-y-4">
    <div className="w-full min-h-[180px] text-center 
      bg-[url('https://kanji.mochidemy.com/_next/static/media/badge_1.d5baa091.svg')] 
      bg-contain bg-center bg-no-repeat 
      flex flex-col justify-center items-center">
      <p className="text-green-800 text-base font-bold">Bạn đã học được</p>
      <p className="text-2xl text-yellow-600 font-bold">{totalWords} từ</p>
    </div>

    <div className="w-full min-h-[180px] text-center 
      bg-[url('https://kanji.mochidemy.com/_next/static/media/badge_2.2bed5320.svg')] 
      bg-contain bg-center bg-no-repeat 
      flex flex-col justify-center items-center">
      <p className="text-green-900 text-base font-bold">Bạn đã học liên tục </p>
      <p className="text-2xl text-orange-500 font-bold">{streak} ngày</p>
    </div>
  </div>
</div>

    </div>

  );
};

export default PracticePage;
