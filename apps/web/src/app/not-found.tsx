import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { buttonClass, cn } from '@nerdose/ui';

import { useDocumentTitle } from '@/hooks/use-document-title';

export function NotFound() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.documentTitle'));

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6">
      <div className="space-y-4 lg:col-span-6 lg:col-start-4">
        <h1 tabIndex={-1} className="font-mono text-title-page break-words">
          {t('notFound.title')}
        </h1>
        <p className="text-base">{t('notFound.message')}</p>
        <Link to="/" className={cn(buttonClass(), 'w-full lg:w-auto')}>
          <span aria-hidden="true">←</span>
          {t('notFound.back')}
        </Link>
      </div>
    </div>
  );
}
