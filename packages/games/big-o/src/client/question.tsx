import { cn } from '@nerdose/ui';

import type { Translate } from './types';

type QuestionProps = {
  t: Translate;
  as: 'h1' | 'h2' | 'p';
  className?: string;
};

/** The fixed question of the game, with `f(n)` in the game accent. */
export function Question({ t, as: Tag, className }: QuestionProps) {
  return (
    <Tag
      className={cn('font-mono text-title-section text-text lg:text-title-section-lg', className)}
    >
      {t('question.before')}
      <span className="text-game-big-o">f(n)</span>
      {t('question.after')}
    </Tag>
  );
}
