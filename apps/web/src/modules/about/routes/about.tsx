import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Panel, cn, linkClass } from '@nerdose/ui';

import { useDocumentTitle } from '@/hooks/use-document-title';

export const ATTRIBUTION_URLS = {
  wikipedia: 'https://www.wikipedia.org/',
  wikidata: 'https://www.wikidata.org/',
  license: 'https://creativecommons.org/licenses/by-sa/4.0/',
};

function ExternalLink({ href, children }: { href: string; children?: React.ReactNode }) {
  const { t } = useTranslation();
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-4 hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      {children}
      <span className="sr-only"> {t('about.newTab')}</span>
    </a>
  );
}

const PANEL = 'min-w-0 grow basis-130';
const BODY = 'text-body text-text-lede';

export function Component() {
  const { t } = useTranslation();
  useDocumentTitle(t('about.documentTitle'));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h1 tabIndex={-1} className="font-mono text-title-page break-words text-text">
          {t('about.title')}
        </h1>
        <p className="max-w-lede text-body-lede text-text-lede">{t('about.intro')}</p>
      </div>
      <div className="flex flex-wrap gap-5">
        <Panel title={t('about.games.title')} className={PANEL}>
          <p className={BODY}>{t('about.games.body')}</p>
          <Link to="/" className={cn(linkClass(), 'mt-auto self-start')}>
            {t('about.games.link')}
            <span aria-hidden="true">→</span>
          </Link>
        </Panel>
        <Panel title={t('about.streaks.title')} className={PANEL}>
          <p className={BODY}>{t('about.streaks.body')}</p>
          <Link to="/stats" className={cn(linkClass(), 'mt-auto self-start')}>
            {t('about.streaks.link')}
            <span aria-hidden="true">→</span>
          </Link>
        </Panel>
        <Panel title={t('about.attribution.title')} className={PANEL}>
          <p className={BODY}>
            <Trans
              i18nKey="about.attribution.body"
              components={{
                wikipedia: <ExternalLink href={ATTRIBUTION_URLS.wikipedia} />,
                wikidata: <ExternalLink href={ATTRIBUTION_URLS.wikidata} />,
                license: <ExternalLink href={ATTRIBUTION_URLS.license} />,
              }}
            />
          </p>
        </Panel>
        <Panel title={t('about.privacy.title')} className={PANEL}>
          <p className={BODY}>{t('about.privacy.body')}</p>
        </Panel>
      </div>
      <Link to="/" className={cn(linkClass(), 'self-start')}>
        <span aria-hidden="true">←</span>
        {t('about.back')}
      </Link>
    </div>
  );
}
