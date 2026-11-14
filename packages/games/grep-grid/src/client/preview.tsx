import { WORDS_COUNT, payloadSchema } from '../definition/schemas';

import { Board } from './board';
import { previewCells, solutionKeys } from './cells';
import { translatorFor } from './translate';
import type { PreviewProps } from './types';
import { WordList } from './word-list';

/**
 * Solution-mode preview for the admin: the full payload only arrives through
 * /api/admin/*, so this must never be mounted in `web`. Read-only, no effects.
 */
export function Preview({ payload, language }: PreviewProps) {
  const p = payloadSchema.parse(payload);
  const t = translatorFor(language);
  const cells = previewCells(p.grid, solutionKeys(p));
  const rows = p.words.map((w) => ({
    term_id: w.term_id,
    word: w.word,
    definition: w.definition[language],
    status: 'solution' as const,
  }));
  return (
    <div lang={language} className="flex flex-col gap-5">
      <Board
        mode="result"
        cells={cells}
        label={t('preview.boardLabel', { total: WORDS_COUNT })}
        t={t}
      />
      <WordList rows={rows} mode="preview" t={t} />
    </div>
  );
}
