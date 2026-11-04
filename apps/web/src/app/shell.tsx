import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router';

export function Shell() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = t('shell.title');
  }, [t]);

  return (
    <div className="min-h-dvh bg-bg font-mono text-text">
      <header className="px-4 py-4">
        <span className="text-accent">
          <span aria-hidden="true">&gt; </span>
          {t('shell.brand')}
        </span>
      </header>
      <main className="px-4">
        <h1 className="sr-only">{t('shell.title')}</h1>
        <Outlet />
      </main>
    </div>
  );
}
