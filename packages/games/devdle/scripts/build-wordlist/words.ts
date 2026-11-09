import { WORD_PATTERN } from '../../src/definition/schemas';

export function filterWords(lines: readonly string[]): string[] {
  return lines.map((l) => l.trim().toUpperCase()).filter((w) => WORD_PATTERN.test(w));
}

/** ENABLE filtrado ∪ labels de Wikidata, en mayúsculas, ordenado (ordinal) y sin duplicados. */
export function buildWordList(enableText: string, labels: readonly string[]): string[] {
  const words = new Set([...filterWords(enableText.split('\n')), ...filterWords(labels)]);
  return [...words].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function serializeWordList(words: readonly string[]): string {
  return `${words.join('\n')}\n`;
}
