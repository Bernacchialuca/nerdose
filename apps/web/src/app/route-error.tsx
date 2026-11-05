import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';

import { CTA_SECONDARY } from '@/components/cta';

export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-bg px-4 py-8 font-mono text-text">
      <div role="alert">
        <h1 className="text-xl font-bold">{t('errors.title')}</h1>
        <button
          type="button"
          onClick={() => {
            location.reload();
          }}
          className={`${CTA_SECONDARY} mt-4`}
        >
          {t('errors.retry')}
        </button>
      </div>
    </main>
  );
}
