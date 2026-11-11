import type { Translate } from './types';

/** Decorative vertical axis beside the list: «antes» at the top, «después» at the bottom. */
export function TimeAxis({ t }: { t: Translate }) {
  return (
    <div
      aria-hidden="true"
      className="flex w-5 shrink-0 flex-col items-center gap-2 py-1 font-mono text-label-comment text-game-timeline-muted"
    >
      <span className="rotate-180 [writing-mode:vertical-rl]">{t('game.axisBefore')}</span>
      <span className="w-0.5 grow bg-game-timeline-rail" />
      <span>↓</span>
      <span className="rotate-180 [writing-mode:vertical-rl]">{t('game.axisAfter')}</span>
    </div>
  );
}
