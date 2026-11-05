import { useTranslation } from 'react-i18next';

import { useDocumentTitle } from '@/hooks/use-document-title';

export function Component() {
  const { t } = useTranslation();
  useDocumentTitle(t('shell.title'));
  return (
    <h1 tabIndex={-1} className="sr-only">
      {t('shell.title')}
    </h1>
  );
}
