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

  // Mobile: título, grilla, lista y card de cierre (racha + próximo desafío) en una columna.
  // Desktop: grilla y card de cierre a la izquierda (7/12), título y lista a la derecha (5/12),
  // ambas columnas arriba para que la grilla y la racha entren en pantalla. En el DOM va primero
  // la columna derecha (el `h1` antes que la grilla); `contents` + `order` arman la columna mobile.
  // Al ganar no hay banner: festeja el confeti del host y el `h1` queda para lectores de pantalla.
  return (
    <div className="flex flex-col gap-6">
      {notices}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-12 lg:items-start lg:gap-7">
        <div className="contents lg:col-span-5 lg:col-start-8 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
          {r.win ? (
            <h1 className="sr-only">{title}</h1>
          ) : (
            <Banner variant="failure" titleAs="h1" title={title} className="order-1 lg:order-none">
              {t('result.gaveUpDetail')}
            </Banner>
          )}
          <div className="order-3 min-w-0 lg:order-none">
            <WordList rows={rows} mode="result" t={t} />
          </div>
          {aside ? <div className="order-5 min-w-0 lg:order-none">{aside}</div> : null}
        </div>
        <div className="contents lg:col-span-7 lg:col-start-1 lg:row-start-1 lg:flex lg:flex-col lg:gap-4">
          <div className="order-2 min-w-0 lg:order-none">
            <Board
              mode="result"
              cells={resultCells(grid, r.words)}
              label={t('board.resultLabel', { found: r.score, revealed })}
              t={t}
            />
          </div>
          {footer ? (
            <div className="order-4 w-full min-w-0 max-w-163.5 lg:order-none">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
