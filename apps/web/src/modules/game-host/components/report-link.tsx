import { useTranslation } from 'react-i18next';

import { cn, linkClass } from '@nerdose/ui';

/** Disparador de O-01. `reported` lo deja deshabilitado (sigue enfocable para devolverle el foco). */
export function ReportLink({ reported, onOpen }: { reported: boolean; onOpen: () => void }) {
  const { t } = useTranslation();
  if (reported) {
    return (
      <button
        type="button"
        aria-disabled="true"
        className={cn(
          linkClass({ tone: 'subtle' }),
          'cursor-not-allowed text-text-disabled hover:text-text-disabled',
        )}
      >
        <span aria-hidden="true">✓</span> {t('gameHost.report.reported')}
      </button>
    );
  }
  return (
    <button type="button" className={linkClass({ tone: 'subtle' })} onClick={onOpen}>
      {t('gameHost.report.link')}
    </button>
  );
}
