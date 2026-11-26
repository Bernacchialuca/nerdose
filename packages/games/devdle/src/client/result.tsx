import { Banner } from '@nerdose/ui';

import { MAX_GUESSES } from '../definition/schemas';

import { Board } from './board';
import { Distribution } from './distribution';
import { parseResult } from './parse';
import type { ResultProps } from './types';
import { WordCard } from './word-card';

export function Result({ t, notices, result, gameStats, aside, footer }: ResultProps) {
  const r = parseResult(result);
  return (
    <div className="flex flex-col gap-7">
      <Banner
        variant={r.win ? 'success' : 'failure'}
        titleAs="h1"
        title={
          r.win
            ? t('result.won', { score: r.score, max: MAX_GUESSES })
            : r.gave_up
              ? t('result.gaveUp', { max: MAX_GUESSES })
              : t('result.lost', { max: MAX_GUESSES })
        }
      >
        {r.win ? t('result.wonDetail') : t('result.lostDetail')}
      </Banner>
      {notices}
      <div className="flex flex-wrap justify-center gap-10">
        {/* Principal: lo que jugaste y la card de cierre. Lateral: la explicación (palabra),
            las stats y el reporte, en ese orden. */}
        <div className="flex min-w-0 grow-999 basis-140 flex-col gap-7">
          <div className="flex flex-col items-center gap-3">
            <Board
              length={r.word.length}
              guesses={r.guesses}
              rows={r.guesses.length}
              label={t('board.resultLabel')}
              t={t}
            />
            {r.hint ? (
              <p className="font-mono text-label-comment text-text-muted">
                <span aria-hidden="true">💡 </span>
                {t('result.hintUsed', { n: r.hint.position + 1, letter: r.hint.letter })}
              </p>
            ) : null}
          </div>
          {footer}
        </div>
        <div className="flex min-w-0 max-w-devdle-aside grow basis-75 flex-col gap-4">
          <WordCard result={r} t={t} />
          {gameStats ? <Distribution result={r} stats={gameStats} t={t} /> : null}
          {aside}
        </div>
      </div>
    </div>
  );
}
