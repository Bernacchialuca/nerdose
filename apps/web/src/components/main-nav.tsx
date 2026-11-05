import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { cn } from '@nerdose/ui';

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const ITEMS = [
  { to: '/', key: 'nav.games', end: true },
  { to: '/stats', key: 'nav.stats', end: false },
  { to: '/about', key: 'nav.about', end: false },
] as const;

export function MainNav({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('nav.label')} className={className}>
      <ul className="flex flex-wrap items-center gap-x-2">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'inline-flex min-h-11 items-center px-2',
                  isActive ? 'text-accent' : 'text-text-muted',
                  FOCUS,
                )
              }
            >
              {t(item.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
