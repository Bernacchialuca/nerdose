import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Panel, buttonClass } from '@nerdose/ui';

import { useDocumentTitle } from '@/hooks/use-document-title';

export function NotFound() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.documentTitle'));

  return (
    <Panel className="mx-auto w-full max-w-lede">
      <h1 tabIndex={-1} className="font-mono text-title-page break-words text-text">
        {t('notFound.title')}
      </h1>
      <p className="text-body text-text-lede">{t('notFound.message')}</p>
      <Link to="/" className={buttonClass({ fullWidth: true })}>
        <span aria-hidden="true">←</span>
        {t('notFound.back')}
      </Link>
    </Panel>
  );
}
