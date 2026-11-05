import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

export function SiteFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border px-4 py-4 text-xs text-text-dim lg:px-12">
      {t('footer.domain')}
      <span aria-hidden="true"> · </span> {t('footer.privacy')}
      <span aria-hidden="true"> · </span>
      <Link
        to="/about"
        className="inline-flex min-h-11 items-center text-accent underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {t('footer.about')}
      </Link>
    </footer>
  );
}
