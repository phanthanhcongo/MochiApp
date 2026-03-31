// src/routes/language-routes/enRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

import WordPracticePage from '../../english/pages/WordPracticePage';
import GrammarPracticePage from '../../english/pages/GrammarPracticePage';
import LoginPage from '../../Login';
import RegisterPage from '../../Register';

import ImportWordsModal from '../../english/forms/ImportWordsModal';
import MultipleChoicePractice from '../../english/practice/MultipleChoicePractice';
import PracticeSummary from '../../english/components/PracticeSummary';
import FillInBlankPractice from '../../english/practice/FillInBlankPractice';
import VoicePractice from '../../english/practice/VoicePractice';
import SentenceCompletionPractice from '../../english/practice/SentenceCompletionPractice';
import CreateWordForm from '../../english/forms/CreateWordForm';
import VocabularyTable from '../../english/components/VocabularyTable';
import ChatPage from '../../components/Chat/ChatPage';

import ProfileSettings from '../../ProfileSettings';
import EditWordForm from '../../english/forms/EditWordForm';

export default function EnRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/en/home-grammar" element={<GrammarPracticePage />} />
        <Route path="/en/home" element={<WordPracticePage />} />
        <Route path="/en/chat" element={<ChatPage />} />
        <Route path="/en/import" element={<ImportWordsModal />} />
        <Route path="/en/quiz/multiple" element={<MultipleChoicePractice />} />
        <Route path="/en/summary" element={<PracticeSummary />} />
        <Route path="/en/quiz/voicePractice" element={<VoicePractice />} />
        <Route path="/en/quiz/fillInBlank" element={<FillInBlankPractice />} />
        <Route path="/en/quiz/multipleSentence" element={<SentenceCompletionPractice />} />
        <Route path="/en/add" element={<CreateWordForm />} />
        <Route path="/en/listWord" element={<VocabularyTable />} />
        <Route path="/en/editWord/:id" element={<EditWordForm />} />
        <Route path="/en/ProfileSettings" element={<ProfileSettings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

