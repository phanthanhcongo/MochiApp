import { BrowserRouter } from 'react-router-dom';
import AppRoutes_2 from './router/routeDemo';
import { LanguageProvider } from './router/LanguageContext';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AppRoutes_2 />
      </LanguageProvider>
    </BrowserRouter>
  );
}
