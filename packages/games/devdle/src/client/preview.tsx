import { payloadSchema, type DevdleGuess } from '../definition/schemas';

import { Board } from './board';
import { translatorFor } from './translate';
import type { PreviewProps } from './types';
import { WordCard } from './word-card';

/**
 * Solution-mode preview for the admin: the full payload only arrives through
 * /api/admin/*, so this must never be mounted in `web`. Read-only, no effects.
 */
export function Preview({ payload, language }: PreviewProps) {
  const p = payloadSchema.parse(payload);
  const t = translatorFor(language);
  const solution: DevdleGuess = {
    guess: p.word,
    marks: [...p.word].map(() => 'correct' as const),
  };
  return (
    <div lang={language} className="flex flex-col items-center gap-5">
      <Board
        length={p.word.length}
        guesses={[solution]}
        rows={1}
        label={t('preview.boardLabel', { word: p.word })}
        t={t}
      />
      <div className="w-full">
        <WordCard
          headingLevel={3}
          t={t}
          result={{
            word: p.word,
            category: p.category,
            definition: p.definition[language],
            summary: p.summary[language],
          }}
        />
      </div>
    </div>
  );
}
