import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouteError } from 'react-router';

import { AppHeader, BrandMark, buttonClass } from '@nerdose/ui';

import { ErrorTerminal } from '@/components/error-terminal';
import { SiteFooter } from '@/components/site-footer';

/** Solo en `vite dev` se muestra el mensaje real; en build y en tests nunca se filtra. */
function describeError(error: unknown, fallback: string): string {
  if (import.meta.env.MODE !== 'development') return fallback;
  return error instanceof Error ? `${error.name}: ${error.message}` : fallback;
}

/**
 * Reemplaza al shell entero (es su `errorElement`), así que arma su propio header y footer
 * mínimos sin depender de la sesión ni de queries: lo que rompió puede ser justamente eso.
 * Los enlaces son `<a>` y no `<Link>` para forzar una carga limpia de la app.
 */
export function RouteError() {
  const { t } = useTranslation();
  const error = useRouteError();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg font-sans text-text">
      <AppHeader
        className="font-mono"
        brand={
          <a
            href="/"
            className="inline-flex min-h-11 items-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <BrandMark label={t('shell.brand')} />
          </a>
        }
      />
      <main className="mx-auto w-full min-w-0 max-w-page flex-1 px-8 pt-12 pb-14 font-sans">
        <div role="alert" className="mx-auto w-full max-w-lede">
          <ErrorTerminal
            command="nerdose --play"
            output={describeError(error, t('errors.terminalOutput'))}
            exitCode={1}
            title={t('errors.title')}
            message={t('errors.message')}
            actions={
              <>
                <button
                  type="button"
                  onClick={() => {
                    location.reload();
                  }}
                  className={buttonClass({ fullWidth: true })}
                >
                  {t('errors.retry')}
                </button>
                <a href="/" className={buttonClass({ variant: 'secondary', fullWidth: true })}>
                  <span aria-hidden="true">←</span>
                  {t('errors.back')}
                </a>
              </>
            }
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
