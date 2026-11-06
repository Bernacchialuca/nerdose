import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { StreakPill } from '@nerdose/ui';

import { useSession } from '@/modules/session';

import { useToday } from '../api/use-today';

/** Píldora de racha global del header de la home; se oculta sin datos del día o con error. */
export function GlobalStreakPill() {
  const { t } = useTranslation();
  const { status } = useSession();
  const { data, isError } = useToday();
  if (!data || isError) return null;
  const value =
    status === 'cookies_blocked' || status === 'unavailable' ? null : data.global_streak.current;
  const label =
    value === null
      ? t('catalog.streakPill.labelUnknown')
      : t('catalog.streakPill.label', { count: value });
  return (
    <StreakPill
      value={value}
      render={(props) => <Link to="/stats" aria-label={label} {...props} />}
    >
      {value === null
        ? t('catalog.streakPill.unknown')
        : t('catalog.streakPill.value', { count: value })}
    </StreakPill>
  );
}
