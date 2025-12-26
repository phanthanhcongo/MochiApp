import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import { LanguageProvider } from './routes/LanguageContext';
import { ToastContainer } from './components/ToastContainer';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <ToastContainer />
        <AppRoutes />
      </LanguageProvider>
    </BrowserRouter>
  );
}
