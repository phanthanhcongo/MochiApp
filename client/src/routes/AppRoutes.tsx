import { Suspense, useMemo } from 'react';
import JpRoutes from './language-routes/jpRoutes';
import EnRoutes from './language-routes/enRoutes';
import { useLanguage } from './LanguageContext';
import AppShell from './components/AppShell';

export default function AppRoutes() {
  const { lang } = useLanguage();

  const group = useMemo(() => {
    if (!lang) return null;
    return lang === 'jp' ? <JpRoutes /> : <EnRoutes />;
  }, [lang]);

 

  return (
    <Suspense>
      <AppShell>{group}</AppShell>
    </Suspense>
  );
}

