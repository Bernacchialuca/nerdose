import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';

import { buttonClass, cn } from '@nerdose/ui';

export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-bg px-4 py-8 font-sans text-text">
      <div role="alert">
        <h1 className="font-mono text-title-page break-words">{t('errors.title')}</h1>
        <button
          type="button"
          onClick={() => {
            location.reload();
          }}
          className={cn(buttonClass({ variant: 'secondary' }), 'mt-4')}
        >
          {t('errors.retry')}
        </button>
      </div>
    </main>
  );
}
