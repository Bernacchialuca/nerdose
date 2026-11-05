import { useTranslation } from 'react-i18next';

import { useToday } from '../api/use-today';

/** `#número` del desafío del día para el header del shell; se oculta sin número o con error. */
export function ChallengeNumber() {
  const { t } = useTranslation();
  const { data, isError } = useToday();
  const number = data?.number;
  if (typeof number !== 'number' || isError) return null;
  return (
    <p className="text-text-muted">
      <span className="sr-only">{t('catalog.challengeLabel')} </span>
      {t('catalog.challengeNumber', { number })}
    </p>
  );
}
