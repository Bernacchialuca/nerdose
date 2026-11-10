import { WORD_PATTERN } from '../../src/definition/schemas';

export function filterWords(lines: readonly string[]): string[] {
  return lines.map((l) => l.trim().toUpperCase()).filter((w) => WORD_PATTERN.test(w));
}

/**
 * ENABLE filtrado ∪ labels de Wikidata ∪ extras curados, en mayúsculas, ordenado (ordinal)
 * y sin duplicados. Los extras cubren términos que las clases de Wikidata no traen (p. ej. LINUX).
 */
export function buildWordList(
  enableText: string,
  labels: readonly string[],
  extras: readonly string[] = [],
): string[] {
  const words = new Set([
    ...filterWords(enableText.split('\n')),
    ...filterWords(labels),
    ...filterWords(extras),
  ]);
  return [...words].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
}

export function serializeWordList(words: readonly string[]): string {
  return `${words.join('\n')}\n`;
}
