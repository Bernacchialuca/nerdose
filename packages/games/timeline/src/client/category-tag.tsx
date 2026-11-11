import type { TimelineCategory } from '@nerdose/core';

import type { Translate } from './types';

/** Category of one milestone (the challenge mixes categories); it never reveals the date. */
export function CategoryTag({ category, t }: { category: TimelineCategory; t: Translate }) {
  return (
    <span data-category={category} className="font-mono text-label-comment text-text-dim">
      {`// ${t(`categories.${category}`)}`}
    </span>
  );
}
