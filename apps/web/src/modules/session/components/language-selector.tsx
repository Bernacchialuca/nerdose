import { useTranslation } from 'react-i18next';

import { LOCALES } from '@nerdose/core';
import { SegmentedControl } from '@nerdose/ui';

import { useSession } from '../use-session';

export function LanguageSelector() {
  const { t } = useTranslation();
  const { status, locale, changeLocale } = useSession();
  return (
    <SegmentedControl
      label={t('language.label')}
      value={locale}
      options={LOCALES.map((code) => ({ value: code, label: t(`language.${code}`), lang: code }))}
      onChange={(code) => void changeLocale(code)}
      disabled={status === 'loading'}
    />
  );
}
