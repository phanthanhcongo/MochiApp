import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlay, FaVolumeUp, FaRedo, FaHome, FaClock, FaCheckCircle, FaAward, FaTimesCircle, FaSignOutAlt } from "react-icons/fa";
import JapanesePageLayout from '../components/JapanesePageLayout';
import { getApiUrl } from '../../apiClient';
import { showToast } from '../../components/Toast';

// Custom lightweight fullscreen canvas confetti generator
const triggerConfetti = () => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '9999';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const colors = ['#6366f1', '#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
  const particles: Array<{
    x: number;
    y: number;
    size: number;
    color: string;
    speedX: number;
    speedY: number;
    rotation: number;
    rotationSpeed: number;
  }> = [];

  for (let i = 0; i < 80; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height * 0.6,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 15,
      speedY: -Math.random() * 15 - 5,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }

  let animationFrameId: number;
  const startTime = Date.now();

  const animate = () => {
    if (Date.now() - startTime > 2000) {
      window.removeEventListener('resize', resize);
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas);
      }
      cancelAnimationFrame(animationFrameId);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedY += 0.4; // gravity
      p.speedX *= 0.98; // air resistance
      p.rotation += p.rotationSpeed;

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    });

    animationFrameId = requestAnimationFrame(animate);
  };

  animate();
};

interface MatchingCard {
  id: number;
  text: string;
  subtext?: string;
  type: 'key' | 'value';
}

interface JapaneseWord {
  id: number;
  kanji: string;
  reading_hiragana: string;
  meaning_vi: string;
}

const MatchingGamePage: React.FC = () => {
  const navigate = useNavigate();

  // Game states
  const [gameState, setGameState] = useState<'select' | 'playing' | 'completed'>('select');
  const [randomLimit, setRandomLimit] = useState<number>(20);
  const [randomLevel, setRandomLevel] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [allWords, setAllWords] = useState<JapaneseWord[]>([]);

  // Playing states
  const [currentRound, setCurrentRound] = useState(0);
  const wordsPerRound = 5;
  const totalRounds = Math.ceil(allWords.length / wordsPerRound);

  // Words for current round
  const roundWords = useMemo(() => {
    const startIdx = currentRound * wordsPerRound;
    return allWords.slice(startIdx, startIdx + wordsPerRound);
  }, [allWords, currentRound]);
  // Card items for match board
  const [keys, setKeys] = useState<MatchingCard[]>([]);
  const [values, setValues] = useState<MatchingCard[]>([]);

  // Selection & Match states
  const [selectedKey, setSelectedKey] = useState<number | null>(null);
  const [selectedValue, setSelectedValue] = useState<number | null>(null);
  const [matchedIds, setMatchedIds] = useState<Set<number>>(new Set());

  // Synchronously compute if current round is finished
  const isRoundFinished = useMemo(() => {
    if (roundWords.length === 0) return false;
    return roundWords.every(w => matchedIds.has(w.id));
  }, [roundWords, matchedIds]);
  const [wrongKeyId, setWrongKeyId] = useState<number | null>(null);
  const [wrongValueId, setWrongValueId] = useState<number | null>(null);
  const [roundCompleted, setRoundCompleted] = useState(false);

  // Stats states (local only, no DB updates!)
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [incorrectAttempts, setIncorrectAttempts] = useState(0);
  const [correctMatchesCount, setCorrectMatchesCount] = useState(0);
  const timerRef = useRef<any>(null);

  // Exit modal states
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);

  // Exit handlers
  const handleToggle = () => {
    setShowConfirmExit(true);
    setIsPlaying(false);
  };

  const handleConfirmExit = () => {
    setShowConfirmExit(false);
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/jp/home');
    }
  };

  // Speech pronunciation helper for Japanese
  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window && text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';

      const voices = window.speechSynthesis.getVoices();
      const japaneseVoice = voices.find(voice => voice.lang === 'ja-JP' && voice.name.includes('Google'))
        || voices.find(voice => voice.lang === 'ja-JP' && voice.name.includes('Microsoft'))
        || voices.find(voice => voice.lang === 'ja-JP');

      if (japaneseVoice) {
        utterance.voice = japaneseVoice;
      }

      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Call adjust-review API to adjust the review time based on answer correctness
  const adjustReviewTimeOnServer = useCallback((wordId: number, isCorrect: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // 1. Push to Local Storage Queue to prevent data loss on exit
    const storageKey = 'matching_reviewed_words';
    const currentQueue: Array<{ wordId: number; correct: boolean; timestamp: number }> = JSON.parse(
      localStorage.getItem(storageKey) || '[]'
    );
    const newLog = { wordId, correct: isCorrect, timestamp: Date.now() };
    currentQueue.push(newLog);
    localStorage.setItem(storageKey, JSON.stringify(currentQueue));

    // 2. Call API with keepalive
    fetch(`${getApiUrl()}/jp/practice/adjust-review/${wordId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ correct: isCorrect }),
      keepalive: true, // Browser keeps request alive even if unmounted or closed
    })
      .then((res) => {
        if (res.ok) {
          // 3. Remove from Local Storage Queue on success
          const updatedQueue: Array<{ wordId: number; correct: boolean; timestamp: number }> = JSON.parse(
            localStorage.getItem(storageKey) || '[]'
          );
          const filteredQueue = updatedQueue.filter(
            (item) => !(item.wordId === wordId && item.correct === isCorrect)
          );
          localStorage.setItem(storageKey, JSON.stringify(filteredQueue));
        } else {
          console.warn(`Không thể cập nhật thời gian ôn tập cho từ #${wordId}`);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi gọi API adjust-review:', err);
      });
  }, []);

  // Auto-sync leftover logs from previous sessions on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const storageKey = 'matching_reviewed_words';
    const leftoverQueue: Array<{ wordId: number; correct: boolean }> = JSON.parse(
      localStorage.getItem(storageKey) || '[]'
    );

    if (leftoverQueue.length > 0) {
      console.log(`🔄 Phát hiện ${leftoverQueue.length} log ghép thẻ tiếng Nhật tồn đọng, đang đồng bộ...`);
      
      leftoverQueue.forEach((item) => {
        fetch(`${getApiUrl()}/jp/practice/adjust-review/${item.wordId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ correct: item.correct }),
          keepalive: true,
        })
          .then((res) => {
            if (res.ok) {
              const currentQueue: Array<{ wordId: number; correct: boolean }> = JSON.parse(
                localStorage.getItem(storageKey) || '[]'
              );
              const filtered = currentQueue.filter(
                (q) => !(q.wordId === item.wordId && q.correct === item.correct)
              );
              localStorage.setItem(storageKey, JSON.stringify(filtered));
            }
          })
          .catch((err) => {
            console.error(`Không thể đồng bộ log tồn đọng cho từ #${item.wordId}:`, err);
          });
      });
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (gameState === 'playing' && !roundCompleted && isPlaying) {
      timerRef.current = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState, roundCompleted, isPlaying]);

  // Start the game by loading words
  const handleStartGame = () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    const levelQuery = randomLevel !== 'all' ? `&level=${randomLevel}` : '';

    fetch(`${getApiUrl()}/jp/practice/random?limit=${randomLimit}${levelQuery}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Không thể tải từ vựng');
        return res.json();
      })
      .then((data) => {
        const scenarios = data.scenarios || [];
        if (scenarios.length === 0) {
          showToast('Không có từ vựng nào ở cấp độ này. Vui lòng chọn cấp độ khác!');
          return;
        }

        const wordsList: JapaneseWord[] = scenarios.map((s: any) => ({
          id: s.word.id,
          kanji: s.word.kanji,
          reading_hiragana: s.word.reading_hiragana,
          meaning_vi: s.word.meaning_vi,
        }));

        setAllWords(wordsList);
        setSecondsElapsed(0);
        setIncorrectAttempts(0);
        setCorrectMatchesCount(0);
        setCurrentRound(0);
        setGameState('playing');
      })
      .catch((err) => {
        console.error(err);
        showToast('Đã xảy ra lỗi khi tạo game. Vui lòng thử lại!');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Initialize matching cards for current round
  useEffect(() => {
    if (roundWords.length === 0) return;

    // Generate keys (Japanese Kanji/Hira words) and shuffle
    const newKeys: MatchingCard[] = roundWords.map(w => ({
      id: w.id,
      text: w.kanji || w.reading_hiragana || '',
      subtext: w.kanji && w.reading_hiragana ? w.reading_hiragana : undefined,
      type: 'key' as const
    })).sort(() => Math.random() - 0.5);

    // Generate values (Vietnamese meanings) and shuffle
    const newValues: MatchingCard[] = roundWords.map(w => ({
      id: w.id,
      text: w.meaning_vi,
      type: 'value' as const
    })).sort(() => Math.random() - 0.5);

    setKeys(newKeys);
    setValues(newValues);
    setMatchedIds(new Set());
    setSelectedKey(null);
    setSelectedValue(null);
    setWrongKeyId(null);
    setWrongValueId(null);
    setRoundCompleted(false);
  }, [roundWords]);

  // Check matching logic when both are selected
  useEffect(() => {
    if (selectedKey !== null && selectedValue !== null) {
      if (selectedKey === selectedValue) {
        // MATCH DETECTED!
        const matchedWord = roundWords.find(w => w.id === selectedKey);
        if (matchedWord) {
          speak(matchedWord.kanji || matchedWord.reading_hiragana || '');
        }

        // Adjust review time on server (correct = true)
        adjustReviewTimeOnServer(selectedKey, true);

        // Add to matches
        setMatchedIds(prev => {
          const next = new Set(prev);
          next.add(selectedKey);
          return next;
        });

        setCorrectMatchesCount(prev => prev + 1);
        setSelectedKey(null);
        setSelectedValue(null);
      } else {
        // INCORRECT MATCH!
        setWrongKeyId(selectedKey);
        setWrongValueId(selectedValue);
        setIncorrectAttempts(prev => prev + 1);

        // Adjust review time on server for both incorrect choices
        adjustReviewTimeOnServer(selectedKey, false);
        adjustReviewTimeOnServer(selectedValue, false);

        // Vibrate / flash red for 800ms then reset selection
        const timer = setTimeout(() => {
          setSelectedKey(null);
          setSelectedValue(null);
          setWrongKeyId(null);
          setWrongValueId(null);
        }, 800);

        return () => clearTimeout(timer);
      }
    }
  }, [selectedKey, selectedValue, roundWords, speak, adjustReviewTimeOnServer]);

  // Check if round or entire game is finished
  useEffect(() => {
    if (isRoundFinished) {
      setRoundCompleted(true);
      triggerConfetti();

      const nextRoundTimer = setTimeout(() => {
        if (currentRound + 1 < totalRounds) {
          // Reset states synchronously before incrementing round to avoid visual overlaps
          setMatchedIds(new Set());
          setRoundCompleted(false);
          setCurrentRound(prev => prev + 1);
        } else {
          // Game fully completed! Show score card
          setGameState('completed');
          triggerConfetti();
        }
      }, 1800);

      return () => clearTimeout(nextRoundTimer);
    }
  }, [isRoundFinished, currentRound, totalRounds]);

  const handleKeyClick = (id: number) => {
    if (matchedIds.has(id) || wrongKeyId !== null) return;
    const wordObj = roundWords.find(w => w.id === id);
    if (wordObj) speak(wordObj.kanji || wordObj.reading_hiragana || '');
    setSelectedKey(id);
  };

  const handleValueClick = (id: number) => {
    if (matchedIds.has(id) || wrongValueId !== null) return;
    setSelectedValue(id);
  };

  // Format seconds to MM:SS
  const formatTime = (totalSec: number) => {
    const min = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const sec = (totalSec % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const currentProgress = allWords.length > 0 ? (correctMatchesCount / allWords.length) * 100 : 0;

  return (
    <JapanesePageLayout>
      {/* Background decoration */}
      <div className="flex-1 flex flex-col justify-start items-center relative overflow-hidden bg-gradient-to-tr from-indigo-50/20 via-transparent to-emerald-50/20 py-8 px-4 w-full">

        {/* SELECT STATE */}
        {gameState === 'select' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white border border-slate-100/80 rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-100 flex flex-col items-center mt-6 sm:mt-12"
          >
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl mb-4 shadow-inner">
              🧩
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight text-center">Game Ghép Thẻ Tiếng Nhật</h2>
            <p className="text-slate-500 text-xs sm:text-sm text-center mt-2 leading-relaxed">
              Trò chơi rèn luyện trí nhớ! Ghép chữ Hán/Hiragana tiếng Nhật với nghĩa tiếng Việt tương ứng. Trò chơi này hoạt động độc lập và không ảnh hưởng đến lịch sử ôn tập của bạn.
            </p>

            <div className="w-full my-6 border-b border-slate-100" />

            {/* Select size pill row */}
            <div className="w-full flex flex-col gap-2 mb-4">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Số lượng câu hỏi</label>
              <div className="grid grid-cols-3 gap-3 w-full">
                {[20, 40, 60].map((size) => (
                  <button
                    key={size}
                    onClick={() => setRandomLimit(size)}
                    className={`py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${randomLimit === size
                        ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/10 scale-105'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                      }`}
                  >
                    {size} từ
                  </button>
                ))}
              </div>
            </div>

            {/* Select level dropdown */}
            <div className="w-full flex flex-col gap-2 mb-6">
              <label className="text-xs text-slate-400 font-bold uppercase tracking-wider">Cấp độ từ vựng</label>
              <select
                value={randomLevel}
                onChange={(e) => setRandomLevel(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3 text-xs text-slate-600 font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer hover:border-slate-300"
              >
                <option value="all">Tất cả cấp độ</option>
                <option value="1">Cấp độ 1</option>
                <option value="2">Cấp độ 2</option>
                <option value="3">Cấp độ 3</option>
                <option value="4">Cấp độ 4</option>
                <option value="5">Cấp độ 5</option>
                <option value="6">Cấp độ 6</option>
                <option value="7">Cấp độ 7</option>
              </select>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartGame}
              disabled={isLoading}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm sm:text-base shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              {isLoading ? (
                <>Đang chuẩn bị... <span className="animate-spin text-lg">⏳</span></>
              ) : (
                <>Bắt đầu chơi 🎮</>
              )}
            </motion.button>
          </motion.div>
        )}

        {/* PLAYING STATE */}
        {gameState === 'playing' && (
          <div className="w-full max-w-4xl flex flex-col items-center">

            {/* Top Stat Toolbar */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-100 p-4 rounded-2xl shadow-sm mb-6">

              {/* Progress and Level indicator */}
              <div className="flex items-center gap-3">
                <div className="text-indigo-600 bg-indigo-50 font-black px-3.5 py-1.5 rounded-full text-xs">
                  Vòng {currentRound + 1} / {totalRounds}
                </div>
                <div className="text-emerald-600 bg-emerald-50 font-black px-3.5 py-1.5 rounded-full text-xs">
                  Khớp: {correctMatchesCount} / {allWords.length}
                </div>
              </div>

              {/* Progress bar visual */}
              <div className="flex-1 w-full max-w-md h-2 bg-slate-100 rounded-full overflow-hidden mx-0 sm:mx-4">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-300"
                  style={{ width: `${currentProgress}%` }}
                />
              </div>

              {/* Local timer & Exit */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-600 font-extrabold text-sm bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                  <FaClock className="text-slate-400" />
                  {formatTime(secondsElapsed)}
                </div>

                <button
                  onClick={handleToggle}
                  className="p-2 bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition cursor-pointer"
                  title="Thoát trò chơi"
                >
                  <FaSignOutAlt className="text-xl" />
                </button>
              </div>
            </div>

            {/* Game Board Title */}
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">Ghép thẻ từ vựng</h2>
              <p className="text-slate-500 text-xs sm:text-sm mt-1">Ghép các chữ Hán/Hiragana bên trái với nghĩa tương ứng bên phải.</p>
            </div>

            {/* Columns Container */}
            <div className="grid grid-cols-2 gap-4 sm:gap-6 w-full max-w-3xl mb-8">

              {/* LEFT COLUMN: Vocabulary Keys (Kanji/Hiragana) */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="text-slate-400 text-center font-bold text-xs uppercase tracking-wider">Từ vựng</div>
                <AnimatePresence>
                  {keys.map((card) => {
                    const isSelected = selectedKey === card.id;
                    const isMatched = matchedIds.has(card.id);
                    const isWrong = wrongKeyId === card.id;

                    let cardStyle = 'border-slate-200/80 bg-white text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:border-indigo-300 hover:shadow-md';
                    if (isMatched) {
                      cardStyle = 'border-emerald-200 bg-emerald-50/70 text-emerald-700 shadow-none pointer-events-none opacity-40 line-through scale-95';
                    } else if (isWrong) {
                      cardStyle = 'border-rose-400 bg-rose-50 text-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.2)] animate-shake';
                    } else if (isSelected) {
                      cardStyle = 'border-indigo-500 bg-indigo-50/80 text-indigo-700 font-black shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-2 ring-indigo-500/20';
                    }

                    return (
                      <motion.button
                        key={`key-${card.id}`}
                        whileHover={!isMatched ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!isMatched ? { scale: 0.98 } : {}}
                        onClick={() => handleKeyClick(card.id)}
                        className={`h-16 sm:h-20 w-full px-4 rounded-2xl border text-center flex flex-col items-center justify-center transition-all duration-300 cursor-pointer ${cardStyle}`}
                        style={{ willChange: 'transform' }}
                      >
                        {card.subtext ? (
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-indigo-400 font-semibold mb-0.5 leading-none">{card.subtext}</span>
                            <span className="font-extrabold text-base sm:text-lg md:text-xl text-slate-800 flex items-center gap-1.5">
                              {card.text}
                              {!isMatched && <FaVolumeUp className="text-[10px] text-slate-400/80 inline-block hover:text-indigo-500" />}
                            </span>
                          </div>
                        ) : (
                          <span className="font-extrabold text-base sm:text-lg md:text-xl text-slate-800 flex items-center gap-1.5 truncate max-w-full">
                            {card.text}
                            {!isMatched && <FaVolumeUp className="text-[10px] text-slate-400/80 inline-block hover:text-indigo-500" />}
                          </span>
                        )}
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>

              {/* RIGHT COLUMN: Meaning Values */}
              <div className="flex flex-col gap-3 sm:gap-4">
                <div className="text-slate-400 text-center font-bold text-xs uppercase tracking-wider">Nghĩa của từ</div>
                <AnimatePresence>
                  {values.map((card) => {
                    const isSelected = selectedValue === card.id;
                    const isMatched = matchedIds.has(card.id);
                    const isWrong = wrongValueId === card.id;

                    let cardStyle = 'border-slate-200/80 bg-white text-slate-700 shadow-[0_2px_4px_rgba(0,0,0,0.03)] hover:border-indigo-300 hover:shadow-md';
                    if (isMatched) {
                      cardStyle = 'border-emerald-200 bg-emerald-50/70 text-emerald-700 shadow-none pointer-events-none opacity-40 line-through scale-95';
                    } else if (isWrong) {
                      cardStyle = 'border-rose-400 bg-rose-50 text-rose-600 shadow-[0_0_8px_rgba(244,63,94,0.2)] animate-shake';
                    } else if (isSelected) {
                      cardStyle = 'border-indigo-500 bg-indigo-50/80 text-indigo-700 font-black shadow-[0_0_12px_rgba(99,102,241,0.15)] ring-2 ring-indigo-500/20';
                    }

                    return (
                      <motion.button
                        key={`val-${card.id}`}
                        whileHover={!isMatched ? { scale: 1.02, y: -1 } : {}}
                        whileTap={!isMatched ? { scale: 0.98 } : {}}
                        onClick={() => handleValueClick(card.id)}
                        className={`h-16 sm:h-20 w-full px-4 rounded-2xl border text-center font-bold text-xs sm:text-sm md:text-base flex items-center justify-center transition-all duration-300 cursor-pointer ${cardStyle}`}
                        style={{ willChange: 'transform' }}
                      >
                        <span className="line-clamp-2 max-w-full text-center">
                          {card.text}
                        </span>
                      </motion.button>
                    );
                  })}
                </AnimatePresence>
              </div>

            </div>

            {/* Visual feedback banner on round complete */}
            <AnimatePresence>
              {roundCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -10 }}
                  className="bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-full shadow-lg text-sm sm:text-base flex items-center gap-2 mb-6"
                >
                  🎉 Tuyệt vời! Đã hoàn thành vòng {currentRound + 1}!
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* COMPLETED STATE */}
        {gameState === 'completed' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center mt-6"
          >
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center text-4xl mb-4 text-amber-500 shadow-inner">
              <FaAward />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-slate-800 tracking-tight text-center">Hoàn Thành Trò Chơi!</h2>
            <p className="text-slate-500 text-xs sm:text-sm text-center mt-2">
              Bạn đã hoàn thành ghép đôi xuất sắc toàn bộ các từ vựng đã chọn.
            </p>

            {/* Scorecard grid */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-md my-8">
              <div className="bg-indigo-50/50 rounded-2xl p-4 text-center border border-indigo-50/20">
                <FaClock className="text-indigo-500 text-lg mx-auto mb-1" />
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Thời gian</div>
                <div className="text-lg font-black text-indigo-700 mt-0.5">{formatTime(secondsElapsed)}</div>
              </div>
              <div className="bg-emerald-50/50 rounded-2xl p-4 text-center border border-emerald-50/20">
                <FaCheckCircle className="text-emerald-500 text-lg mx-auto mb-1" />
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Đã ghép</div>
                <div className="text-lg font-black text-emerald-700 mt-0.5">{allWords.length} từ</div>
              </div>
              <div className="bg-amber-50/50 rounded-2xl p-4 text-center border border-amber-50/20">
                <span className="text-lg block mb-0.5">⚠️</span>
                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Lỗi ghép</div>
                <div className="text-lg font-black text-amber-700 mt-0.5">{incorrectAttempts} lần</div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-4 w-full max-w-md mb-8">
              <button
                onClick={() => setGameState('select')}
                className="flex-1 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10 transition-all active:translate-y-0.5"
              >
                <FaRedo className="text-xs" />
                Chơi lại
              </button>
              <button
                onClick={() => {
                  if (window.history.state && window.history.state.idx > 0) {
                    navigate(-1);
                  } else {
                    navigate('/jp/home');
                  }
                }}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all border border-slate-200"
              >
                <FaHome className="text-xs" />
                Về trang chủ
              </button>
            </div>

            <div className="w-full border-t border-slate-100 my-2" />

            {/* Review list */}
            <div className="w-full text-left mt-4">
              <h3 className="font-bold text-slate-700 text-sm sm:text-base mb-4">Danh sách từ vựng đã ôn luyện:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
                {allWords.map((item) => (
                  <div key={item.id} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-bold text-slate-800 flex flex-col">
                      <span className="flex items-center gap-1.5">
                        {item.kanji || item.reading_hiragana}
                        <button
                          onClick={() => speak(item.kanji || item.reading_hiragana)}
                          className="text-[10px] text-slate-400 hover:text-indigo-500 transition focus:outline-none"
                        >
                          <FaVolumeUp />
                        </button>
                      </span>
                      {item.kanji && item.reading_hiragana && (
                        <span className="text-[10px] text-slate-400 font-semibold">{item.reading_hiragana}</span>
                      )}
                    </span>
                    <span className="text-slate-500 font-semibold self-center">{item.meaning_vi}</span>
                  </div>
                ))}
              </div>
            </div>

          </motion.div>
        )}
      </div>

      {/* Confirm Exit Modal Dialog */}
      {showConfirmExit && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="relative bg-white p-6 sm:p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-4 border border-slate-100">
            <button
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded-full transition cursor-pointer"
              onClick={() => {
                setShowConfirmExit(false);
                setIsPlaying(true);
              }}
              title="Đóng"
            >
              <FaTimesCircle className="text-slate-500 text-xl" />
            </button>

            <p className="text-xl font-bold text-slate-800">Bạn muốn ngừng chơi à?</p>
            <p className="text-slate-500 text-sm">Tiến trình chơi hiện tại của bạn sẽ bị mất.</p>

            <button
              onClick={() => {
                setShowConfirmExit(false);
                setIsPlaying(true);
              }}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-lime-500 hover:bg-lime-600 text-white font-bold transition shadow-lg shadow-lime-500/20 cursor-pointer"
            >
              <FaPlay className="text-sm" />
              Tiếp tục chơi
            </button>

            <button
              onClick={handleConfirmExit}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition border border-slate-200 cursor-pointer"
            >
              <FaSignOutAlt className="text-slate-600 text-lg" />
              Quay lại trang chủ
            </button>
          </div>
        </div>
      )}

      {/* Dynamic CSS injecting for wiggling/shaking wrong match effect */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          15%, 45%, 75% { transform: translateX(-6px); }
          30%, 60%, 90% { transform: translateX(6px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </JapanesePageLayout>
  );
};

export default MatchingGamePage;
