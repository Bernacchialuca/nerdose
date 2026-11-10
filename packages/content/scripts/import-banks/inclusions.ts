import { AppError, TERM_CATEGORIES, type TermCategory } from '@nerdose/core';

export type Inclusion = { wikidataId: string; category: TermCategory };

const CATEGORIES = new Set<string>(TERM_CATEGORIES);

/**
 * Ítems de Wikidata que se suman a mano a los candidatos: términos que ninguna clase de
 * `TERM_CLASSES` trae (p. ej. Linux es una "familia de sistemas operativos").
 * Formato: `Q388 linux` por línea; `#` abre un comentario.
 */
export function parseInclusions(text: string): Inclusion[] {
  const inclusions: Inclusion[] = [];
  const seen = new Set<string>();
  text.split(/\r?\n/).forEach((rawLine, index) => {
    const line = rawLine.replace(/#.*$/, '').trim();
    if (line === '') return;
    const match = /^(Q[1-9]\d*)\s+(\S+)$/i.exec(line);
    const where = `inclusions.txt, línea ${index + 1}`;
    if (match === null) {
      throw new AppError(
        'validation_error',
        `${where}: se esperaba "Q123 categoría" (recibido: ${line})`,
      );
    }
    const wikidataId = (match[1] as string).toUpperCase();
    const category = match[2] as string;
    if (!CATEGORIES.has(category)) {
      throw new AppError(
        'validation_error',
        `${where}: categoría desconocida "${category}" (válidas: ${TERM_CATEGORIES.join(', ')})`,
      );
    }
    if (seen.has(wikidataId)) {
      throw new AppError('validation_error', `${where}: ${wikidataId} está repetido`);
    }
    seen.add(wikidataId);
    inclusions.push({ wikidataId, category: category as TermCategory });
  });
  return inclusions;
}
