import type { DevdleResult } from '../definition/schemas';

import { SectionPanel } from './section-panel';
import type { Translate } from './types';

type WordCardProps = {
  result: Pick<DevdleResult, 'word' | 'category' | 'definition' | 'summary'>;
  t: Translate;
  headingLevel?: 2 | 3;
};

export function WordCard({ result, t, headingLevel }: WordCardProps) {
  return (
    <SectionPanel title={t('result.wordTitle')} headingLevel={headingLevel}>
      <p className="font-mono text-title-panel text-game-devdle">{result.word}</p>
      <p className="font-mono text-label-comment text-text-muted">
        {t('result.category', { category: t(`category.${result.category}`) })}
      </p>
      <p className="font-sans text-body text-text-body">{result.definition}</p>
      <dl className="flex flex-col gap-1">
        <dt className="font-mono text-label-comment text-text-dim">{t('result.summaryLabel')}</dt>
        <dd className="font-sans text-body-sm text-text-body">{result.summary}</dd>
      </dl>
      <p className="font-sans text-caption text-text-dim">{t('result.source')}</p>
    </SectionPanel>
  );
}
