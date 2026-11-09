import {
  MAX_GUESSES,
  type DevdleGuess,
  type DevdleState,
  type LetterMark,
} from '../definition/schemas';

export const MARK_EMOJI: Record<LetterMark, string> = {
  correct: '🟩',
  present: '🟨',
  absent: '⬛',
};

export const MARK_GLYPH: Record<LetterMark, string> = {
  correct: '✓',
  present: '~',
  absent: '✗',
};

export type KeyState = LetterMark;

const RANK: Record<LetterMark, number> = { absent: 0, present: 1, correct: 2 };

/** Best state seen per letter: correct > present > absent. */
export function keyStates(guesses: readonly DevdleGuess[]): Partial<Record<string, KeyState>> {
  const out: Partial<Record<string, KeyState>> = {};
  for (const g of guesses) {
    [...g.guess].forEach((letter, i) => {
      const mark = g.marks[i];
      if (mark === undefined) return;
      const prev = out[letter];
      if (prev === undefined || RANK[mark] > RANK[prev]) out[letter] = mark;
    });
  }
  return out;
}

/** Same rule as `definition`, reimplemented to avoid importing code that carries solutions. */
export function isFinished(state: DevdleState): boolean {
  const last = state.guesses.at(-1);
  return (
    state.guesses.length >= MAX_GUESSES ||
    (last !== undefined && last.marks.every((m) => m === 'correct'))
  );
}
