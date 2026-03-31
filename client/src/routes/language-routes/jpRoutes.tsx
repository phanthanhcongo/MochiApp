// src/routes/language-routes/jpRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

import WordPracticePage from '../../japanese/pages/WordPracticePage';
import CreateWordForm from '../../japanese/forms/CreateWordForm';
import ImportWordsModal from '../../japanese/forms/ImportWordsModal';
import ResultProgress from '../../japanese/components/ResultProgress';
import VocabularyTable from '../../japanese/components/VocabularyTable';
import PracticeWrapper from '../../japanese/components/PracticeWrapper';
import GrammarPracticePage from '../../japanese/pages/GrammarPracticePage';
import ChatPage from '../../components/Chat/ChatPage';

import LoginPage from '../../Login';
import RegisterPage from '../../Register';
import ProfileSettings from '../../ProfileSettings';
import EditWordForm from '../../japanese/forms/EditWordForm';

export default function JpRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/jp/home-grammar" element={<GrammarPracticePage />} />
        <Route path="/jp/home" element={<WordPracticePage />} />
        <Route path="/jp/chat" element={<ChatPage />} />
        <Route path="/jp/add" element={<CreateWordForm />} />
        <Route path="/jp/import" element={<ImportWordsModal />} />
        <Route path="/jp/quiz/multiple" element={<PracticeWrapper />} />
        <Route path="/jp/quiz/ReadingHiraganaPractice" element={<PracticeWrapper />} />
        <Route path="/jp/quiz/TypingRomajiPractice" element={<PracticeWrapper />} />
        <Route path="/jp/quiz/voicePractice" element={<PracticeWrapper />} />
        <Route path="/jp/quiz/WritingKanjiPractice" element={<PracticeWrapper />} />
        <Route path="/jp/summary" element={<ResultProgress />} />
        <Route path="/jp/listWord" element={<VocabularyTable />} />
        <Route path="/jp/ProfileSettings" element={<ProfileSettings />} />
        <Route path="/jp/editWord/:id" element={<EditWordForm />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

