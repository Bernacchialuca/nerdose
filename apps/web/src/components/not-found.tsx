import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router';

import { buttonClass } from '@nerdose/ui';

import { useDocumentTitle } from '@/hooks/use-document-title';

import { ErrorTerminal } from './error-terminal';

export function NotFound() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  useDocumentTitle(t('notFound.documentTitle'));

  return (
    <div className="mx-auto w-full max-w-lede">
      <ErrorTerminal
        command={`cd ${pathname}`}
        output={t('notFound.terminalOutput', { path: pathname })}
        exitCode={1}
        title={t('notFound.title')}
        message={t('notFound.message')}
        actions={
          <Link to="/" className={buttonClass({ fullWidth: true })}>
            <span aria-hidden="true">←</span>
            {t('notFound.back')}
          </Link>
        }
      />
    </div>
  );
}
