import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useDocumentTitle } from '@/hooks/use-document-title';

export function NotFound() {
  const { t } = useTranslation();
  useDocumentTitle(t('notFound.documentTitle'));

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6">
      <div className="space-y-4 lg:col-span-6 lg:col-start-4">
        <h1 tabIndex={-1} className="text-2xl font-bold">
          {t('notFound.title')}
        </h1>
        <p className="text-base">{t('notFound.message')}</p>
        <Link
          to="/"
          className="inline-flex min-h-11 w-full items-center justify-center gap-2 bg-accent px-4 font-bold text-on-accent lg:w-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">←</span>
          {t('notFound.back')}
        </Link>
      </div>
    </div>
  );
}
