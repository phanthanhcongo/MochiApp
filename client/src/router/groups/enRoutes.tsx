// src/router/groups/enRoutes.tsx
import { Routes, Route ,Navigate} from 'react-router-dom';
import ProtectedRoute from '../ProtectedRoute';

import PracticePage from '../../english/PracticePage';
import LoginPage from '../../Login';

// import AddEnglishWordForm from '../../english/AddEnglishWordForm';
import ImportVocabularyButton from '../../english/ImportVocabularyButton';
import MultipleChoiceQuiz from '../../english/MultipleChoiceQuiz';
import ResultProgress from '../../english/ResultProgress';
import FillInBlankPractice from '../../english/FillInBlankPractice';
import VoicePractice from '../../english/VoicePractice';
import MultipleSentence from '../../english/MultipleSentence';
import AddEnglishWord from '../../english/AddEnglishWordForm';
import EnglishPracticeDisplay from '../../english/EnglishPracticeDisplay';

import ProfileSettings from '../../ProfileSettings';
import EditEnglishWordForm from '../../english/EditEnglishWordForm';

export default function EnRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected */}
      <Route element={<ProtectedRoute />}>
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
      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
}
