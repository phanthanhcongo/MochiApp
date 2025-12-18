// src/routes/language-routes/jpRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

import PracticePage from '../../japanese/pages/PracticePage';
import AddJapaneseWordForm from '../../japanese/forms/AddJapaneseWordForm';
import ImportVocabularyButton from '../../japanese/forms/ImportVocabularyButton';
import ResultProgress from '../../japanese/components/ResultProgress';
import ReviewWordList from '../../japanese/components/ReviewWordList';
import PracticeWrapper from '../../japanese/components/PracticeWrapper';
import PracticePageGrammar from '../../japanese/pages/PracticePageGrammar';

import LoginPage from '../../Login';
import RegisterPage from '../../Register';
import ProfileSettings from '../../ProfileSettings';
import EditJapaneseWordForm from '../../japanese/forms/EditWord';

export default function JpRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/jp/home-grammar" element={<PracticePageGrammar />} />
        <Route path="/jp/home" element={<PracticePage />} />
        <Route path="/jp/add" element={<AddJapaneseWordForm />} />
        <Route path="/jp/import" element={<ImportVocabularyButton />} />
        <Route path="/jp/quiz/multiple" element={<PracticeWrapper />} />
        <Route path="/jp/quiz/hiraganaPractice" element={<PracticeWrapper />} />
        <Route path="/jp/quiz/romajiPractice" element={<PracticeWrapper />} />
        <Route path="/jp/quiz/voicePractice" element={<PracticeWrapper />} />
        <Route path="/jp/quiz/multiCharStrokePractice" element={<PracticeWrapper />} />
        <Route path="/jp/summary" element={<ResultProgress />} />
        <Route path="/jp/listWord" element={<ReviewWordList />} />
        <Route path="/jp/ProfileSettings" element={<ProfileSettings />} />
        <Route path="/jp/editWord/:id" element={<EditJapaneseWordForm />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

