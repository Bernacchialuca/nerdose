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

  return (
    <div className="flex flex-wrap gap-7">
      <div className="flex min-w-0 grow-7 basis-155 flex-col gap-6">
        <Banner
          variant={r.win ? 'success' : 'failure'}
          titleAs="h1"
          title={
            r.win
              ? t('result.won', { total: WORDS_COUNT })
              : t('result.gaveUp', { score: r.score, total: WORDS_COUNT })
          }
        >
          {r.win ? undefined : t('result.gaveUpDetail')}
        </Banner>
        {notices}
        <div className="flex justify-center">
          <Board
            mode="result"
            cells={resultCells(grid, r.words)}
            label={t('board.resultLabel', { found: r.score, revealed })}
            t={t}
          />
        </div>
      </div>
      <div className="flex min-w-0 grow-5 basis-85 flex-col gap-4">
        <WordList rows={rows} mode="result" t={t} />
        {aside}
      </div>
      {footer ? <div className="basis-full">{footer}</div> : null}
    </div>
  );
}
