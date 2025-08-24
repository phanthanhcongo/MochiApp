// AppRoutes.tsx
import { Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import PracticePage from '../japanese/PracticePage';
import AddJapaneseWordForm from '../japanese/AddJapaneseWordForm';
import ImportVocabularyButton from '../japanese/ImportVocabularyButton';
import MultipleChoiceQuiz from '../japanese/MultipleChoiceQuiz';
import ResultProgress from '../japanese/ResultProgress';
import HiraganaPractice from '../japanese/HiraganaPractice';
import RomajiPractice from '../japanese/RomajiPractice';
import VoicePractice from '../japanese/VoicePractice';
import MultiCharStrokePractice from '../japanese/MultiCharStrokePractice';
import ReviewWordList from "../japanese/ReviewWordList";
import LoginPage from '../Login';
import AccountSettings from '../ProfileSettings'
const AppRoutes = () => {
  const location = useLocation();
  const isPracticePage = location.pathname === '/';

  return (
    <div className="min-h-screen">
      {isPracticePage ? (
          <ProtectedRoute>
          <PracticePage />
        </ProtectedRoute>
      ) : (
        <div className="bg-[url('https://kanji.mochidemy.com/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fbg.366f773b.webp&w=1920&q=75')] bg-cover bg-center bg-gray-50/80 min-h-screen">
          <div className="xl:w-[60%] min-h-screen mx-auto bg-slate-50">
            <Routes>
              {/* Public */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/add" element={<AddJapaneseWordForm />} />
                <Route path="/import" element={<ImportVocabularyButton />} />
                <Route path="/quiz/multiple" element={<MultipleChoiceQuiz />} />
                <Route path="/quiz/hiraganaPractice" element={<HiraganaPractice />} />
                <Route path="/quiz/romajiPractice" element={<RomajiPractice />} />
                <Route path="/quiz/voicePractice" element={<VoicePractice />} />
                <Route path="/quiz/multiCharStrokePractice" element={<MultiCharStrokePractice/>}/>
                <Route path="/summary" element={<ResultProgress />} />
                <Route path="/listWord" element={<ReviewWordList/>}/>
                <Route path="/accountSettings" element={<AccountSettings/>}/>

              </Route>

              {/* 404 */}
              <Route path="*" element={<div>404 Not Found</div>} />
            </Routes>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppRoutes;
