import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

import type { TermsReadRepository } from '@/domain/publishing/publishing.repository';

/** Ruta del `words.txt` del paquete devdle (recurso de datos, no código). */
export const resolveWordlistPath = (): string =>
  createRequire(import.meta.url).resolve('@nerdose/game-devdle/wordlist');

/** Lista válida de Devdle: archivo base ∪ `terms` aprobados. Nunca se expone por una ruta. */
export class WordList {
  private set: Set<string>;

  private constructor(private readonly base: string[]) {
    this.set = new Set(base);
  }

  static async load(path: string): Promise<WordList> {
    const text = await readFile(path, 'utf8');
    const base = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    return new WordList(base);
  }

  /** Si la consulta falla rechaza y conserva el set anterior. */
  async reload(repo: TermsReadRepository): Promise<void> {
    const rows = await repo.findApprovedTerms();
    this.set = new Set([...this.base, ...rows.map((t) => t.term.toUpperCase())]);
  }

  has(word: string): boolean {
    return this.set.has(word.toUpperCase());
  }
}
