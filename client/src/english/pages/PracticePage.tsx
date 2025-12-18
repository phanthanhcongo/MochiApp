import  { useEffect, useState } from 'react';
import { usePracticeSession } from '../utils/practiceStore';
import type { ReviewWord } from '../utils/practiceStore';
import { useNavigate } from 'react-router-dom';
import Header from '../../japanese/components/Header';
import { motion } from 'framer-motion';

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
      flex min-h-screen pt-[72px] md:pt-[88px] bg-gray-200 text-sm sm:text-base md:text-lg">

  {/* Left Column */}
  <div className="hidden xl:block w-2/10"></div>

  {/* Center Column */}
  <div className="w-full xl:w-6/10 flex-1 flex flex-col items-center justify-start pt-16 sm:pt-12 md:pt-16 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-8 md:px-12 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] rounded-[48px] border border-slate-50 mx-auto relative">
    
    {/* Top summary */}
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center space-x-3 mb-10 bg-slate-50/80 px-6 py-3 rounded-2xl border border-slate-100 shadow-sm"
    >
      <div className="w-12 h-12 rounded-xl bg-white shadow-inner flex items-center justify-center border border-slate-100">
        <img
          src="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon_notebook.cd7f4676.png&w=256&q=75"
          alt="Notebook icon"
          className="w-7 h-7"
        />
      </div>
      <p className="text-slate-600 font-medium">
        Bạn đã học được <span className="font-black text-slate-800 text-lg">{totalWords} từ</span>
      </p>
    </motion.div>

    {/* Bar Chart */}
    <div className="relative w-full max-w-2xl mb-12 px-2">
      <div className="flex justify-between items-end space-x-2 sm:space-x-4 md:space-x-6 h-64 sm:h-72 pb-8">
        {reviewStats.map((item, index) => (
          <div key={item.level} className="flex flex-col items-center flex-1 group">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="text-xs font-bold text-slate-400 mb-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
            >
              {item.count}
            </motion.div>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${Math.min(item.count / 2 + 40, 220)}px` }}
              transition={{ type: "spring", damping: 15, stiffness: 100, delay: index * 0.1 }}
              className={`${item.color} w-full max-w-[56px] rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.1)] group-hover:shadow-[0_6px_0_rgba(0,0,0,0.1)] group-hover:-translate-y-1 transition-all cursor-pointer relative`}
            />
            <div className="mt-5 text-xl font-black text-slate-200 group-hover:text-slate-400 transition-colors">
              {item.level}
            </div>
          </div>
        ))}
      </div>
      <div className="w-full h-2 bg-slate-50 rounded-full" />
    </div>

    {/* Action Section */}
    <div className="flex flex-col items-center w-full max-w-md bg-slate-50/50 rounded-[32px] p-8 border border-slate-100/50">
      <div className="text-slate-500 text-sm font-bold uppercase tracking-widest mb-2">Chuẩn bị ôn tập</div>
      <div className="text-4xl font-black text-red-500 mb-8 flex items-baseline gap-2">
        {reviewWordsCount} <span className="text-xl text-red-400/80">từ</span>
      </div>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleStartPractice}
        disabled={reviewWordsCount === 0}
        className={`relative h-16 w-full sm:w-72 rounded-2xl font-black text-xl transition-all duration-200 ${
          reviewWordsCount > 0
            ? 'bg-lime-500 text-white shadow-[0_6px_0_rgb(101,163,13)] hover:shadow-[0_8px_0_rgb(101,163,13)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
            : 'bg-slate-200 text-slate-400 shadow-[0_4px_0_rgb(203,213,225)] cursor-not-allowed'
        }`}
      >
        <span className="flex items-center justify-center gap-2">
          {reviewWordsCount > 0 ? (
            <>Ôn tập ngay <span className="text-2xl">🔥</span></>
          ) : (
            <>⏳ {nextReviewIn ?? 'Đang chờ...'}</>
          )}
        </span>
      </motion.button>
    </div>
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
