// src/routes/language-routes/enRoutes.tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';
import NotFound from '../components/NotFound';

import PracticePage from '../../english/pages/PracticePage';
import PracticePageGrammar from '../../english/pages/PracticePageGrammar';
import LoginPage from '../../Login';

import ImportVocabularyButton from '../../english/forms/ImportVocabularyButton';
import MultipleChoiceQuiz from '../../english/practice/MultipleChoiceQuiz';
import ResultProgress from '../../english/components/ResultProgress';
import FillInBlankPractice from '../../english/practice/FillInBlankPractice';
import VoicePractice from '../../english/practice/VoicePractice';
import MultipleSentence from '../../english/practice/MultipleSentence';
import AddEnglishWord from '../../english/forms/AddEnglishWordForm';
import EnglishPracticeDisplay from '../../english/components/EnglishPracticeDisplay';

import ProfileSettings from '../../ProfileSettings';
import EditEnglishWordForm from '../../english/forms/EditEnglishWordForm';

export default function EnRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
        <Route path="/en/home-grammar" element={<PracticePageGrammar />} />
        <Route path="/en/home" element={<PracticePage />} />
        <Route path="/en/import" element={<ImportVocabularyButton />} />
        <Route path="/en/quiz/multiple" element={<MultipleChoiceQuiz />} />
        <Route path="/en/summary" element={<ResultProgress />} />
        <Route path="/en/quiz/voicePractice" element={<VoicePractice />} />
        <Route path="/en/quiz/fillInBlank" element={<FillInBlankPractice />} />
        <Route path="/en/quiz/multipleSentence" element={<MultipleSentence />} />
        <Route path="/en/add" element={<AddEnglishWord />} />
        <Route path="/en/listWord" element={<EnglishPracticeDisplay />} />
        <Route path="/en/editWord/:id" element={<EditEnglishWordForm />} />
        <Route path="/en/ProfileSettings" element={<ProfileSettings />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

