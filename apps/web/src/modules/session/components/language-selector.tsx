import { useTranslation } from 'react-i18next';

import { LOCALES } from '@nerdose/core';
import { cn } from '@nerdose/ui';

import { useSession } from '../use-session';

export function LanguageSelector() {
  const { t } = useTranslation();
  const { status, locale, changeLocale } = useSession();
  return (
    <div role="group" aria-label={t('language.label')} className="flex items-center">
      {LOCALES.map((code) => (
        <button
          key={code}
          type="button"
          lang={code}
          aria-pressed={locale === code}
          disabled={status === 'loading'}
          onClick={() => void changeLocale(code)}
          className={cn(
            'min-h-11 min-w-11 border border-text-dim px-2 disabled:opacity-60',
            locale === code ? 'text-accent' : 'text-text-muted',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
          )}
        >
          {t(`language.${code}`)}
        </button>
      ))}
    </div>
  );
}
