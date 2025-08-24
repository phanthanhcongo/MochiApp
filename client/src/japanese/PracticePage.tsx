import  { useEffect, useState } from 'react';
import { usePracticeSession } from './practiceStore';
import type { ReviewWord } from './practiceStore';
import { useNavigate } from 'react-router-dom';
import Header from '../japanese/Header';

interface ReviewStat {
  level: number;
  count: number;
  color: string;
}

interface JpReviewWord {
  id: number;
  kanji: string;
  reading_hiragana: string | null;
  reading_romaji: string | null;
  meaning_vi: string | null;
  jlpt_level: string | null;
  level: number;
  audio_url: string | null;
  last_reviewed_at: string | null;
  next_review_at: string | null;

  examples: {
    id: number;
    sentence_jp: string;
    sentence_hira: string;
    sentence_romaji: string;
    sentence_vi: string;
    example_exercises: {
      id: number;
      question_type: string;
      question_text: string;
      blank_position: number | null;
      answer_explanation: string | null;
      exercise_choices: {
        id: number;
        content: string;
        is_correct: boolean;
      }[];
    }[];
  }[];

  contexts: {
    id: number;
    context_vi: string;
    highlight_line: string;
  }[];

  strokes: {
    id: number;
    stroke_url: string;
  }[];

  hanviet: {
    id: number;
    han_viet: string;
    explanation: string;
  }|null;
}

const PracticePage = () => {
  const [reviewStats, setReviewStats] = useState<ReviewStat[]>([]);
  const [totalWords, setTotalWords] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [reviewWordsCount, setReviewWordsCount] = useState<number>(0);
  const [wordsToReview, setWordsToReview] = useState<JpReviewWord[]>([]);
  const [nextReviewIn, setNextReviewIn] = useState<string | null>(null);
  const { setWords, getNextQuizType } = usePracticeSession();
  const navigate = useNavigate();
// localStorage.setItem('user_id', '2');


useEffect(() => {
  const token = localStorage.getItem('token');
  if (!token) return; // hoặc điều hướng về /login

  fetch('/api/practice/stats', {
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
    const preparedWords: ReviewWord[] = wordsToReview.map((w): ReviewWord => ({
  id: w.id,
  kanji: w.kanji,
  reading_hiragana: w.reading_hiragana || '',
  reading_romaji: w.reading_romaji || '',
  meaning_vi: w.meaning_vi || '',
  hanviet: w.hanviet?.han_viet || undefined,
  hanviet_explanation: w.hanviet?.explanation || undefined,
  example: w.examples?.[0]?.sentence_jp || undefined,
  example_romaji: w.examples?.[0]?.sentence_romaji || undefined,
  example_vi: w.examples?.[0]?.sentence_vi || undefined,
}));


    // console.log('🧠 Từ cần truyền vào store:', preparedWords);

    setWords(preparedWords); // truyền vào store

    // Có thể thêm kiểm tra sau khi set xong (tạm delay 1 tick)
    setTimeout(() => {
      const storedWords = usePracticeSession.getState().words;
      console.log('📦 Dữ liệu đã lưu trong store:', storedWords);
    }, 0);

    const firstQuizType = getNextQuizType();
    navigate(`/jp/quiz/${firstQuizType}`, {
      state: { from: firstQuizType }
    });
  };


  return (
    <div>
      {/* Invisible classes to force Tailwind build colors */}
<div className="hidden">
  bg-red-400 bg-fuchsia-300 bg-yellow-400 bg-green-400 bg-sky-400 bg-indigo-500 bg-purple-600 bg-gray-400
</div>

      <Header />
      <div className="bg-[url('https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbg.366f773b.webp&w=1920&q=75')] bg-cover bg-center
      flex min-h-screen bg-gray-200 text-base md:text-lg">

  {/* Left Column */}
  <div className="w-2/10 hidden xl:block hidden"></div>

  {/* Center Column */}
  <div className="w-6/10 flex-1 flex flex-col items-center justify-start py-12 px-4 bg-slate-50 shadow-md mx-auto ">
    
    {/* Top summary */}
    <div className="flex items-center space-x-3">
<div className="w-14 h-14 rounded-full bg-slate-50 border border-gray-300 border-b-8 shadow-inner flex items-center justify-center">
  <img
    src="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon_notebook.cd7f4676.png&w=256&q=75"
    alt="Notebook icon"
    className="w-8 h-8"
  />
</div>

     
      <p className="text-gray-700 text-lg md:text-sm">
        Bạn đã học được <span className="font-bold">{totalWords} từ</span>
      </p>
    </div>

    {/* Bar Chart */}
    <div className="relative w-full max-w-3xl">
      <div className="flex justify-center items-end space-x-8 h-90 pb-10">
        {reviewStats.map((item) => (
          <div key={item.level} className="flex flex-col items-center">
            <div className="text-base font-semibold mb-1">{item.count} từ</div>
            <div
              className={`${item.color} w-14 rounded-t-md`}
              style={{ height: `${Math.min(item.count / 20 + 20, 180)}px` }}
            />
            <div className="mt-3 text-xl font-bold text-black">{item.level}</div>
          </div>
        ))}
      </div>
      <div className="absolute left-0 right-0 bottom-20 h-[8px] bg-gray-300 rounded-full mx-auto max-w-[60%]" />
    </div>

    {/* Ready to review */}
    <div className=" text-gray-800 text-xl">
      Chuẩn bị ôn tập: <span className="font-bold text-red-500">{reviewWordsCount} từ</span>
    </div>

    <button
      onClick={handleStartPractice}
  className="m-10 h-15 w-60  text-slate-50 font-bold text-xl font-medium px-8 py-3 rounded-full shadow-md bg-gradient-to-r from-lime-400 to-green-600 hover:brightness-110 transition"
      disabled={reviewWordsCount === 0}
    >
      {reviewWordsCount > 0 ? 'Ôn tập ngay' : `⏳ ${nextReviewIn ?? 'Đang chờ...'}`}
    </button>
  </div>

  {/* Right Column */}
  <div className="w-2/10 xl:block hidden    flex flex-col items-center px-4 space-y-4">
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
      <p className="text-green-900 text-base font-bold">Bạn đã học liên tục</p>
      <p className="text-2xl text-orange-500 font-bold">{streak} ngày</p>
    </div>
  </div>
</div>

    </div>

  );
};

export default PracticePage;
