import { useEffect, useState } from 'react';
import { usePracticeSession } from '../utils/practiceStore';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import { motion } from 'framer-motion';
import { API_URL } from '../../apiClient';

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

interface JpReviewWord {
  id: number;
  kanji: string;
  reading_hiragana: string | null;
  reading_romaji: string | null;
  meaning_vi: string | null;

  examples: {
    sentence_jp: string;
    sentence_romaji: string;
    sentence_vi: string;
  }[];

  hanviet: {
    han_viet: string;
    explanation: string;
  } | null;
}

interface PracticeScenario {
  order: number;
  word: JpReviewWord;
  quizType: string | null;
}

const PracticePage = () => {
  const [reviewStats, setReviewStats] = useState<ReviewStat[]>([]);
  const [totalWords, setTotalWords] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [reviewWordsCount, setReviewWordsCount] = useState<number>(0);
  const [_wordsToReview, setWordsToReview] = useState<JpReviewWord[]>([]);
  const [preparedScenarios, setPreparedScenarios] = useState<PracticeScenario[]>([]);
  const [preparedRandomAnswers, setPreparedRandomAnswers] = useState<Array<{ meaning_vi: string }>>([]);
  const [nextReviewIn, setNextReviewIn] = useState<string | null>(null);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);

  const { setScenarios, setRandomAnswers } = usePracticeSession();
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
    const storedRaw = localStorage.getItem('reviewed_words');
    const reviewedWords = storedRaw ? JSON.parse(storedRaw) : [];
    if (Array.isArray(reviewedWords) && reviewedWords.length > 0) {
      navigate('/jp/summary');
      return;
    }

    fetch(`${API_URL}/jp/practice/stats`, {
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

  // Fetch scenarios và randomAnswers ngay sau khi component mount để chuẩn bị sẵn
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Chỉ fetch nếu có từ cần ôn
    const fetchPreparedData = async () => {
      try {
        const [scenariosRes, randomAnswersRes] = await Promise.all([
          fetch(`${API_URL}/jp/practice/scenarios`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          }),
          fetch(`${API_URL}/jp/practice/listWord`, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
          })
        ]);

        if (scenariosRes.status === 401 || randomAnswersRes.status === 401) {
          localStorage.removeItem('token');
          window.location.replace('/login');
          return;
        }

        if (scenariosRes.ok) {
          const scenariosData = await scenariosRes.json();
          const scenarios: PracticeScenario[] = scenariosData.scenarios || [];
          setPreparedScenarios(scenarios);
        }

        if (randomAnswersRes.ok) {
          const randomAnswersData = await randomAnswersRes.json();
          const allWords = (randomAnswersData.allWords || []).map((w: any) => ({
            meaning_vi: w.meaning_vi || ''
          })).filter((w: { meaning_vi: string }) => w.meaning_vi !== '');
          
          // Shuffle và lấy 50 từ ngẫu nhiên
          const shuffled = allWords.sort(() => Math.random() - 0.5);
          const randomAnswers = shuffled.slice(0, 50);
          setPreparedRandomAnswers(randomAnswers);
        }
      } catch (err) {
        console.error('Lỗi khi fetch prepared data:', err);
      }
    };

    // Chỉ fetch khi có từ cần ôn (có thể check sau khi stats load xong)
    // Hoặc fetch luôn, sẽ được update khi stats load xong
    fetchPreparedData();
  }, []);


  sessionStorage.setItem('reload_count', '0'); // Reset về 0 trước
  useEffect(() => {
    if (!nextReviewIn) { setRemainingSec(null); return; }
    setRemainingSec(hmsToSeconds(nextReviewIn));
  }, [nextReviewIn]);
  useEffect(() => {
    if (remainingSec === null) return;
    const id = setInterval(() => {
      setRemainingSec((prev) => (prev !== null ? Math.max(prev - 1, 0) : null));
    }, 1000);
    return () => clearInterval(id);
  }, [remainingSec]);
  const handleStartPractice = () => {
    // Dùng preparedScenarios và preparedRandomAnswers đã được chuẩn bị sẵn
    if (preparedScenarios.length === 0) {
      console.warn('Chưa có scenarios để ôn tập');
      return;
    }

    // Set scenarios và randomAnswers vào store
    setScenarios(preparedScenarios);
    setRandomAnswers(preparedRandomAnswers);

    // Lấy quizType từ scenario đầu tiên
    const firstScenario = preparedScenarios[0];
    const firstQuizType = firstScenario.quizType;

    if (!firstQuizType) {
      console.error('Không có quiz type cho scenario đầu tiên');
      navigate('/jp/summary');
      return;
    }

    navigate(`/jp/quiz/${firstQuizType}`, {
      state: { from: firstQuizType }
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Invisible classes to force Tailwind build colors */}
      <div className="hidden">
        bg-red-400 bg-fuchsia-300 bg-yellow-400 bg-green-400 bg-sky-400 bg-indigo-500 bg-purple-600 bg-gray-400
      </div>

      <div className="shrink-0">
        <Header />
      </div>
      <div className="practice-page-container bg-[url('/103372501_p0.png')] bg-cover bg-center
      flex flex-1 overflow-y-auto text-xs sm:text-sm md:text-base lg:text-lg">

        {/* Left Column */}
        <div className="hidden xl:block w-2/10"></div>

        {/* Center Column */}
        <div className="w-full xl:w-6/10 flex-1 flex flex-col items-center justify-start py-8 sm:py-12 md:py-16 lg:py-20 px-3 sm:px-6 md:px-8 lg:px-12 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.05)] mx-auto relative">
          
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
          <div className="relative w-full max-w-2xl mb-6 sm:mb-8 md:mb-10 lg:mb-12 px-1 sm:px-2">
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
          <div className="flex flex-col items-center w-full max-w-md p-4 sm:p-6 md:p-8 h-[200px] sm:h-[250px] md:h-[300px] lg:h-[350px] xl:h-[400px]">
            <div className="text-slate-500 text-[10px] sm:text-xs md:text-sm font-bold uppercase tracking-wider sm:tracking-widest mb-1 sm:mb-2">Chuẩn bị ôn tập</div>
            <div className="text-2xl sm:text-3xl md:text-4xl font-black text-red-500 mb-4 sm:mb-6 md:mb-8 flex items-baseline gap-1 sm:gap-2">
              {reviewWordsCount} <span className="text-base sm:text-lg md:text-xl text-red-400/80">từ</span>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStartPractice}
              disabled={reviewWordsCount === 0}
              className={`relative h-12 sm:h-14 md:h-16 w-full sm:w-64 md:w-72 rounded-xl sm:rounded-2xl font-black text-sm sm:text-base md:text-lg lg:text-xl transition-all duration-200 ${
                reviewWordsCount > 0
                  ? 'bg-lime-500 text-white shadow-[0_4px_0_rgb(101,163,13)] sm:shadow-[0_6px_0_rgb(101,163,13)] hover:shadow-[0_8px_0_rgb(101,163,13)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-none'
                  : 'bg-slate-200 text-slate-400 shadow-[0_3px_0_rgb(203,213,225)] sm:shadow-[0_4px_0_rgb(203,213,225)] cursor-not-allowed'
              }`}
            >
              <span className="flex items-center justify-center gap-1 sm:gap-2">
                {reviewWordsCount > 0 ? (
                  <>Ôn tập ngay <span className="text-lg sm:text-xl md:text-2xl">🔥</span></>
                ) : (
                  <>⏳ {remainingSec !== null ? formatHMS(remainingSec) : 'Đang chờ...'}</>
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
            <p className="text-green-900 text-base font-bold">Bạn đã học liên tục</p>
            <p className="text-2xl text-orange-500 font-bold">{streak} ngày</p>
          </div>
        </div>
      </div>

    </div>

  );
};

export default PracticePage;
