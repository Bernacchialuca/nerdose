import type { TermCategory } from '@nerdose/core';
import { Badge } from '@nerdose/ui';

import { SectionPanel } from './section-panel';
import type { Translate } from './types';

export function CategoryHint({
  categories,
  t,
}: {
  categories: readonly TermCategory[];
  t: Translate;
}) {
  return (
    <SectionPanel title={t('categories.title')}>
      <ul className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <li key={c}>
            <Badge variant="chip">{t(`category.${c}`)}</Badge>
          </li>
        ))}
      </ul>
      <p className="font-sans text-caption text-text-muted">{t('categories.note')}</p>
    </SectionPanel>
  );
}
