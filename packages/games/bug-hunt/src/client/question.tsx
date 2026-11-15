import { cn } from '@nerdose/ui';

import type { Translate } from './types';

type QuestionProps = { t: Translate; as: 'h1' | 'h2'; className?: string };

/** The fixed question of the game. */
export function Question({ t, as: Tag, className }: QuestionProps) {
  return (
    <Tag
      className={cn(
        'font-mono text-text',
        Tag === 'h1'
          ? 'text-title-section lg:text-title-game'
          : 'text-title-panel lg:text-title-section',
        className,
      )}
    >
      {t('question')}
    </Tag>
  );
}
