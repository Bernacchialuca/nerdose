import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { linkClass } from '@nerdose/ui';

export function BackLink() {
  const { t } = useTranslation();
  return (
    <Link to="/" className={linkClass()}>
      <span aria-hidden="true">←</span> {t('gameHost.back')}
    </Link>
  );
}
