import type { LetterMark } from './schemas';

/** Precondición: `answer` y `guess` tienen el mismo largo (lo valida `applyMove`). */
export function scoreGuess(answer: string, guess: string): LetterMark[] {
  const marks: LetterMark[] = Array.from({ length: guess.length }, () => 'absent');
  const remaining = new Map<string, number>();

  for (let i = 0; i < guess.length; i++) {
    const a = answer.charAt(i);
    if (guess.charAt(i) === a) marks[i] = 'correct';
    else remaining.set(a, (remaining.get(a) ?? 0) + 1);
  }
  for (let i = 0; i < guess.length; i++) {
    if (marks[i] === 'correct') continue;
    const g = guess.charAt(i);
    const left = remaining.get(g) ?? 0;
    if (left > 0) {
      marks[i] = 'present';
      remaining.set(g, left - 1);
    }
  }
  return marks;
}
