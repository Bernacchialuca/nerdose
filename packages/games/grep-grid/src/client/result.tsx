import { Banner } from '@nerdose/ui';

import { GRID_SIZE } from '../shared/geometry';
import { WORDS_COUNT, type GrepGridResult } from '../definition/schemas';

import { Board } from './board';
import { resultCells } from './cells';
import { parsePublicView, parseResult } from './parse';
import type { ResultProps } from './types';
import { WordList, type WordRow } from './word-list';

const FILLER = '·';

/** Letters known from the result alone: the words' own cells, the rest a placeholder. */
function gridFromWords(words: GrepGridResult['words']): string[][] {
  const grid = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => FILLER),
  );
  for (const w of words) {
    w.cells.forEach((c, i) => {
      const row = grid[c.row];
      if (row) row[c.col] = w.word[i] ?? FILLER;
    });
  }
  return grid;
}

export function Result({ t, notices, result, publicView, aside, footer }: ResultProps) {
  const r = parseResult(result);
  const grid = publicView === undefined ? gridFromWords(r.words) : parsePublicView(publicView).grid;
  const revealed = r.words.filter((w) => !w.found).length;
  const rows: WordRow[] = r.words.map((w) => ({
    term_id: w.term_id,
    word: w.word,
    definition: w.definition,
    status: w.found ? 'found' : 'revealed',
  }));

  const title = r.win
    ? t('result.won', { total: WORDS_COUNT })
    : t('result.gaveUp', { score: r.score, total: WORDS_COUNT });

  // Veredicto arriba a todo el ancho (banner con el `h1`), después `notices` y dos columnas.
  // Desktop: grilla y card de cierre (7/12) a la izquierda; lista con definiciones y aside (5/12)
  // a la derecha. Mobile: una columna en el orden del DOM.
  return (
    <div className="flex flex-col gap-6">
      <Banner variant={r.win ? 'success' : 'failure'} titleAs="h1" title={title}>
        {r.win ? t('result.wonDetail') : t('result.gaveUpDetail')}
      </Banner>
      {notices}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-7">
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:gap-4">
          <Board
            mode="result"
            cells={resultCells(grid, r.words)}
            label={t('board.resultLabel', { found: r.score, revealed })}
            t={t}
          />
          {footer ? <div className="w-full min-w-0 max-w-163.5">{footer}</div> : null}
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-5 lg:gap-4">
          <WordList rows={rows} mode="result" t={t} />
          {aside}
        </div>
      </div>
    </div>
  );
}
