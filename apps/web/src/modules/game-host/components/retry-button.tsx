import { useTranslation } from 'react-i18next';

import { buttonClass } from '@nerdose/ui';

export function RetryButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <button type="button" onClick={onClick} className={buttonClass({ variant: 'secondary' })}>
      <span aria-hidden="true">↻</span>
      {t('gameHost.retry')}
    </button>
  );
}
