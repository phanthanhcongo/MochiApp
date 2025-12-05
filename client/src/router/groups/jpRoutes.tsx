// src/router/groups/jpRoutes.tsx
import { Routes, Route ,Navigate} from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

import PracticePage from '../../japanese/PracticePage';
import AddJapaneseWordForm from '../../japanese/AddJapaneseWordForm';
import ImportVocabularyButton from '../../japanese/ImportVocabularyButton';
import ResultProgress from '../../japanese/ResultProgress';
import ReviewWordList from '../../japanese/ReviewWordList';
import PracticeWrapper from '../../japanese/PracticeWrapper';

import LoginPage from '../../Login';
import ProfileSettings from '../../ProfileSettings';
import EditJapaneseWordForm from '../../japanese/EditWord';

export default function JpRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
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
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}

