import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router';

import { navItemClass } from '@nerdose/ui';

const ITEMS = [
  { to: '/', key: 'nav.games', end: true },
  { to: '/stats', key: 'nav.stats', end: false },
  { to: '/about', key: 'nav.about', end: false },
] as const;

export function MainNav({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <nav aria-label={t('nav.label')} className={className}>
      <ul className="flex flex-wrap items-center gap-1">
        {ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) => navItemClass({ active: isActive })}
            >
              {t(item.key)}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
