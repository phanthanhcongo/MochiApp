import { useEffect, useState } from 'react';
import { usePracticeSession } from '../utils/practiceStore';
import type { ReviewWord } from '../utils/practiceStore';
import { useNavigate } from 'react-router-dom';
import Header from '../../japanese/components/Header';
import { motion } from 'framer-motion';
import { getApiUrl } from '../../apiClient';
import { showToast } from '../../components/Toast';

function hmsToSeconds(hms: string): number {
  const [h, m, s] = hms.split(':').map(Number);
  return (h || 0) * 3600 + (m || 0) * 60 + (s || 0);
}

function formatHMS(totalSec: number): string {
  const sec = Math.max(0, totalSec);
  const h = Math.floor(sec / 3600).toString().padStart(2, '0');
  const m = Math.floor((sec % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(sec % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

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
  const [preparedWords, setPreparedWords] = useState<ReviewWord[]>([]);
  const [nextReviewIn, setNextReviewIn] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const { setWords, getNextQuizType } = usePracticeSession();
  const navigate = useNavigate();
  // localStorage.setItem('user_id', '2');

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTo(0, 0);
    document.body.scrollTo(0, 0);
  }, []);

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

    fetch(`${getApiUrl()}/en/practice/stats`, {
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
        setNextReviewIn(data.nextReviewIn || null);

        // Chuẩn bị sẵn 100 từ ngay từ đây để khi bấm nút không cần xử lý
        const prepared: ReviewWord[] = (data.reviewWords || []).map((w: any): ReviewWord => {
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
            context_vi: w.contexts?.[0]?.context_vi ?? '',
            exampleEn: w.exampleEn ?? '',
            exampleVi: w.exampleVn ?? '',
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
        setPreparedWords(prepared);
      })
      .catch((err) => {
        console.error('Fetch stats error:', err);
        showToast('Không thể tải dữ liệu thống kê. Vui lòng thử lại!');
      });

    sessionStorage.setItem('reload_count', '0');
  }, []);


  sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước

  // Convert nextReviewIn to seconds when it changes
  useEffect(() => {
    if (!nextReviewIn) { setRemainingSec(null); return; }
    setRemainingSec(hmsToSeconds(nextReviewIn));
  }, [nextReviewIn]);

  // Countdown timer
  useEffect(() => {
    if (remainingSec === null) return;
    const id = setInterval(() => {
      setRemainingSec((prev) => (prev !== null ? Math.max(prev - 1, 0) : null));
    }, 1000);
    return () => clearInterval(id);
  }, [remainingSec]);

  // Auto-refresh when countdown reaches zero
  useEffect(() => {
    if (remainingSec === 0) {
      console.log('⏰ Countdown reached zero - refreshing practice data...');

      const token = localStorage.getItem('token');
      if (!token) return;

      fetch(`${getApiUrl()}/en/practice/stats`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(async (res) => {
          if (res.status === 401) {
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
          setNextReviewIn(data.nextReviewIn || null);

          // Chuẩn bị lại preparedWords
          const prepared: ReviewWord[] = (data.reviewWords || []).map((w: any): ReviewWord => {
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
              context_vi: w.contexts?.[0]?.context_vi ?? '',
              exampleEn: w.exampleEn ?? '',
              exampleVi: w.exampleVn ?? '',
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
          setPreparedWords(prepared);
          console.log('✅ Stats refreshed - New words available:', data.wordsToReview);
        })
        .catch((err) => console.error('Refresh stats error:', err));
    }
  }, [remainingSec]);


  const handleStartPractice = () => {
    // Dùng preparedWords đã được chuẩn bị sẵn từ lúc fetch stats
    if (preparedWords.length === 0) {
      showToast('Chưa có từ để ôn tập. Vui lòng thử lại sau!');
      return;
    }

    setWords(preparedWords);

    // 🔥 Track that user is practicing WORDS
    localStorage.setItem('practice_type', 'word');

    const firstQuizType = getNextQuizType();
    // console.log('🚀 Bắt đầu với quiz type:', firstQuizType);
    navigate(`/en/quiz/${firstQuizType}`, { state: { from: firstQuizType } });
  };




  return (
    <div>
      {/* Invisible classes to force Tailwind build colors */}
      <div className="hidden">
        bg-red-400 bg-fuchsia-300 bg-yellow-400 bg-green-400 bg-sky-400 bg-indigo-500 bg-purple-600 bg-gray-400
      </div>

      <Header />
      <div className="practice-page-container bg-[url('/103372501_p0.png')] bg-cover bg-center
      flex h-screen bg-gray-200 text-xs sm:text-sm md:text-base lg:text-lg overflow-hidden">

        {/* Left Column */}
        <div className="hidden xl:block w-2/10"></div>

        {/* Center Column */}
        <div className="w-full xl:w-6/10 flex-1 flex flex-col items-center justify-start pt-[30px] 
  pb-8 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-6 md:px-8 lg:px-12 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)]
  mx-auto relative">

          {/* Top summary */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-2 sm:space-x-3 mb-[176px] sm:mb-[232px] md:mb-[288px] lg:mb-8 xl:mb-10 bg-slate-50/80 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-lg sm:rounded-xl bg-white shadow-inner flex items-center justify-center border border-slate-100">
              <img
                src="https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Ficon_notebook.cd7f4676.png&w=256&q=75"
                alt="Notebook icon"
                className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7"
              />
            </div>
            <p className="text-slate-600 font-medium text-xs sm:text-sm md:text-base">
              Bạn đã học được <span className="font-black text-slate-800 text-sm sm:text-base md:text-lg">{totalWords} từ</span>
            </p>
          </motion.div>

          {/* Bar Chart */}
          <div className="relative w-full max-w-2xl mb-6 sm:mb-8 md:mb-10 lg:mb-12 px-1 ">
            <div className="flex justify-between items-end space-x-1 sm:space-x-2 md:space-x-4 lg:space-x-6 h-40 sm:h-52 md:h-64 lg:h-72 pb-4 sm:pb-6 md:pb-8">
              {reviewStats.map((item, index) => (
                <div key={item.level} className="flex flex-col items-center flex-1 group">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    className="text-[10px] sm:text-xs font-bold text-slate-400 mb-2 sm:mb-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    {item.count}
                  </motion.div>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.min(item.count / 2 + 40, 220)}px` }}
                    transition={{ type: "spring", damping: 15, stiffness: 100, delay: index * 0.1 }}
                    className={`${item.color} w-full max-w-[28px] sm:max-w-[36px] md:max-w-[48px] lg:max-w-[56px] rounded-xl sm:rounded-2xl shadow-[0_3px_0_rgba(0,0,0,0.1)] sm:shadow-[0_4px_0_rgba(0,0,0,0.1)] group-hover:shadow-[0_6px_0_rgba(0,0,0,0.1)] group-hover:-translate-y-1 transition-all cursor-pointer relative`}
                  />
                  <div className="mt-2 sm:mt-3 md:mt-4 lg:mt-5 text-base sm:text-lg md:text-xl font-black text-slate-200 group-hover:text-slate-400 transition-colors">
                    {item.level}
                  </div>
                </div>
              ))}
            </div>
            <div className="w-full h-1.5 sm:h-2 bg-slate-50 rounded-full" />
          </div>

          {/* Action Section */}
          <div className="flex flex-col items-center w-full max-w-md bg-slate-50/50 rounded-2xl sm:rounded-3xl lg:rounded-[32px] p-4 sm:p-6 md:p-8 border border-slate-100/50">
            <div className="text-slate-500 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider sm:tracking-widest mb-1 sm:mb-2">Chuẩn bị ôn tập</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-red-500 mb-4 sm:mb-6 md:mb-8 flex items-baseline gap-1 sm:gap-2">
              {reviewWordsCount} <span className="text-base sm:text-lg md:text-xl text-red-400/80">từ</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartPractice}
              disabled={reviewWordsCount === 0}
              className={`relative h-12 sm:h-14 md:h-16 w-full sm:w-64 md:w-72 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg lg:text-xl transition-all duration-200 ${reviewWordsCount > 0
                ? 'bg-lime-500 text-white shadow-[0_4px_0_rgb(101,163,13)] sm:shadow-[0_6px_0_rgb(101,163,13)] hover:shadow-[0_8px_0_rgb(101,163,13)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                : 'bg-slate-200 text-slate-400 shadow-[0_3px_0_rgb(203,213,225)] sm:shadow-[0_4px_0_rgb(203,213,225)] cursor-not-allowed'
                }`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                {reviewWordsCount > 0 ? (
                  <>Ôn tập ngay <span className="text-lg sm:text-xl md:text-2xl">🔥</span></>
                ) : (
                  <>{remainingSec !== null ? formatHMS(remainingSec) : 'Đang chờ...'}</>
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
