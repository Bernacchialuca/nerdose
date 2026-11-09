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
    <div className="flex flex-wrap justify-center gap-10">
      {/* Columna principal: veredicto, tablero, palabra y salidas comparten borde; la columna
          lateral (intentos y rachas) queda como sección aparte. Sin items-center: solo el tablero,
          más angosto, va centrado. */}
      <div className="flex min-w-0 grow-999 basis-140 flex-col gap-7">
        <Banner
          variant={r.win ? 'success' : 'failure'}
          titleAs="h1"
          title={
            r.win
              ? t('result.won', { score: r.score, max: MAX_GUESSES })
              : t('result.lost', { max: MAX_GUESSES })
          }
        >
          {r.win ? undefined : t('result.lostDetail')}
        </Banner>
        {notices}
        <div className="flex justify-center">
          <Board
            length={r.word.length}
            guesses={r.guesses}
            rows={r.guesses.length}
            label={t('board.resultLabel')}
            t={t}
          />
        </div>
        <WordCard result={r} t={t} />
        {footer}
      </div>
      <div className="flex min-w-0 max-w-devdle-aside grow basis-75 flex-col gap-4">
        {gameStats ? <Distribution result={r} stats={gameStats} t={t} /> : null}
        {aside}
      </div>
    </div>
  );
}
