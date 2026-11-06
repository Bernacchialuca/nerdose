import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useDocumentTitle } from '@/hooks/use-document-title';

export const ATTRIBUTION_URLS = {
  wikipedia: 'https://www.wikipedia.org/',
  wikidata: 'https://www.wikidata.org/',
  license: 'https://creativecommons.org/licenses/by-sa/4.0/',
};

const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

function ExternalLink({ href, children }: { href: string; children?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-accent underline ${FOCUS}`}
    >
      {children}
      <span className="sr-only"> {t('about.newTab')}</span>
    </a>
  );
}

const CARD = 'border border-border bg-surface p-4';

export function Component() {
  const { t } = useTranslation();
  useDocumentTitle(t('about.documentTitle'));

  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-6">
      <div className="space-y-4 lg:col-span-10 lg:col-start-2">
        <h1 tabIndex={-1} className="font-mono text-title-page break-words">
          {t('about.title')}
        </h1>
        <p className="text-base">{t('about.intro')}</p>
        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <section aria-labelledby="about-games" className={CARD}>
            <h2 id="about-games" className="font-mono text-title-panel">
              {t('about.games.title')}
            </h2>
            <p className="mt-2 text-base text-text-muted">{t('about.games.body')}</p>
          </section>
          <section aria-labelledby="about-streaks" className={CARD}>
            <h2 id="about-streaks" className="font-mono text-title-panel">
              {t('about.streaks.title')}
            </h2>
            <p className="mt-2 text-base text-text-muted">{t('about.streaks.body')}</p>
          </section>
          <section aria-labelledby="about-attribution" className={CARD}>
            <h2 id="about-attribution" className="font-mono text-title-panel">
              {t('about.attribution.title')}
            </h2>
            <p className="mt-2 text-base text-text-muted">
              <Trans
                i18nKey="about.attribution.body"
                components={{
                  wikipedia: <ExternalLink href={ATTRIBUTION_URLS.wikipedia} />,
                  wikidata: <ExternalLink href={ATTRIBUTION_URLS.wikidata} />,
                  license: <ExternalLink href={ATTRIBUTION_URLS.license} />,
                }}
              />
            </p>
          </section>
          <section aria-labelledby="about-privacy" className={CARD}>
            <h2 id="about-privacy" className="font-mono text-title-panel">
              {t('about.privacy.title')}
            </h2>
            <p className="mt-2 text-base text-text-muted">{t('about.privacy.body')}</p>
          </section>
        </div>
        <Link
          to="/"
          className={`inline-flex min-h-11 items-center gap-2 font-mono text-accent underline ${FOCUS}`}
        >
          <span aria-hidden="true">←</span>
          {t('about.back')}
        </Link>
      </div>
    </div>
  );
}
