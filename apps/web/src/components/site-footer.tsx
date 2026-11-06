import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { linkClass } from '@nerdose/ui';

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="flex flex-col gap-3 border-t border-border-subtle px-8 py-6 font-mono text-label-comment text-text-dim">
      <div className="flex flex-wrap justify-between gap-3">
        <p className="min-w-0">
          <span aria-hidden="true">&gt; </span>
          {t('footer.tagline')}
        </p>
        <p>{t('footer.exit')}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-3">
        <p className="min-w-0">{t('footer.privacy')}</p>
        <Link to="/about" className={linkClass({ tone: 'subtle' })}>
          {t('footer.about')}
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </footer>
  );
}
