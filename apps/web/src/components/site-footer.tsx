import { useTranslation } from 'react-i18next';

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="flex flex-wrap justify-between gap-3 border-t border-border-subtle px-8 py-6 font-mono text-label-comment text-text-dim">
      <p className="min-w-0">
        <span aria-hidden="true">&gt; </span>
        {t('footer.tagline')}
      </p>
      <p>{t('footer.exit')}</p>
    </footer>
  );
}
