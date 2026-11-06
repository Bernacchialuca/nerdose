import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';

import { Panel, buttonClass } from '@nerdose/ui';

export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-dvh bg-bg font-sans text-text">
      <div className="mx-auto w-full max-w-page px-8 pt-12 pb-14">
        <div role="alert" className="mx-auto w-full max-w-lede">
          <Panel>
            <h1 className="font-mono text-title-page break-words text-text">{t('errors.title')}</h1>
            <button
              type="button"
              onClick={() => {
                location.reload();
              }}
              className={buttonClass({ variant: 'secondary', fullWidth: true })}
            >
              {t('errors.retry')}
            </button>
          </Panel>
        </div>
      </div>
    </main>
  );
}
