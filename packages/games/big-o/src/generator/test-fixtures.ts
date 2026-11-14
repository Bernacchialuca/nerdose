import { createHash } from 'node:crypto';

import type { GeneratorHistory, RecentChallenge } from '@nerdose/core';
import { LANGUAGES, type Language, type RunOptions, type RunOutcome } from '@nerdose/polyglot';

import type { BigOPayload } from '../definition';

import { paramCombos } from './catalog/params';
import { RECIPES } from './catalog/recipes';
import type { Params, Recipe } from './catalog/types';
import { buildPayload } from './generate';

export const D = '2027-03-15';

export const seed = (n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`big-o-test-seed-${n}`).digest());

export const seedFrom = (prefix: string, n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`big-o-test-seed-${prefix}-${n}`).digest());

export function recipe(id: string): Recipe {
  const found = RECIPES.find((r) => r.id === id);
  if (!found) throw new Error(`unknown recipe ${id}`);
  return found;
}

export function recent(date: string, id: string, params?: Params): RecentChallenge<BigOPayload> {
  const r = recipe(id);
  const chosen = params ?? paramCombos(r)[0] ?? [];
  return { date, payload: buildPayload(r, chosen) };
}

export const emptyHistory: GeneratorHistory<BigOPayload> = { bankItems: [], recentChallenges: [] };

export const withDate = (p: BigOPayload): BigOPayload => ({ ...p, date: D });

export const noExample = (p: BigOPayload, answer: BigOPayload['answer']): BigOPayload => ({
  ...p,
  answer,
  trap_option: null,
  explanation: { ...p.explanation, example: null },
});

export type FakeCall = { lang: Language; source: string; options: RunOptions | undefined };

/** A runner double: a number array is the counts printed, a string is the literal stdout. */
export function fakeRunner(
  outputs: Partial<Record<Language, readonly number[] | RunOutcome | string>>,
) {
  const calls: FakeCall[] = [];
  const run = (lang: Language, source: string, options?: RunOptions): Promise<RunOutcome> => {
    calls.push({ lang, source, options });
    const out = outputs[lang];
    if (out === undefined) return Promise.reject(new Error(`fakeRunner: no output for ${lang}`));
    if (typeof out === 'string') return Promise.resolve({ ok: true, stdout: out, durationMs: 120 });
    if (Array.isArray(out)) {
      return Promise.resolve({ ok: true, stdout: `${out.join('\n')}\n`, durationMs: 120 });
    }
    return Promise.resolve(out as RunOutcome);
  };
  return { run, calls };
}

export const allLanguages = (value: readonly number[]) =>
  Object.fromEntries(LANGUAGES.map((l) => [l, value])) as Record<Language, readonly number[]>;
