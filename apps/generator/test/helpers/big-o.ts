import type { Db } from '@nerdose/db';
import { buildPayload, createVerify, RECIPES, type Runner } from '@nerdose/game-big-o/generator';
import { runInLanguage, type Language, type RunOptions, type RunOutcome } from '@nerdose/polyglot';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate } from '@/domain/challenge-publishing/generate';
import { createGeneratorRegistry, generatorRegistry, type GeneratorEntry } from '@/games/registry';

import { captureLogger } from './logger';
import { ENV } from './regeneration';
import { withGenerator } from './registry';

export const bigO = generatorRegistry.get('big-o');
export const bigOOnly = createGeneratorRegistry([bigO]);

export const TIMEOUT: RunOutcome = { ok: false, kind: 'timeout', stderr: '', durationMs: 10000 };

/** Serie sintética que ajusta casi igual a O(n) y a O(n log n). */
export const AMBIG = [588, 1233, 2572, 5344, 11067, 22854, 47084, 96802, 198668];

export const CHECKS13 = [
  'texts_bilingual',
  'code_shape',
  'variety_recipe',
  'variety_answer',
  'run_js',
  'run_go',
  'run_java',
  'counts_agree',
  'counts_in_range',
  'example_matches_run',
  'fit_quality',
  'fit_unambiguous',
  'fit_matches_answer',
];

export function recipe(id: string) {
  const found = RECIPES.find((r) => r.id === id);
  if (!found) throw new Error(`unknown recipe ${id}`);
  return found;
}

type Params = Parameters<typeof buildPayload>[1];

/** Fuerza la receta (y sus parámetros) en lugar de la que sortearía generate. */
export function forcedRecipe(
  entry: GeneratorEntry,
  id: string,
  params: Params,
  opts: { dropExample?: boolean } = {},
) {
  const base = buildPayload(recipe(id), params);
  const payload = opts.dropExample
    ? { ...base, explanation: { ...base.explanation, example: null } }
    : base;
  return withGenerator(entry, { generate: ({ date }: { date: string }) => ({ date, ...payload }) });
}

export function withRunner(entry: GeneratorEntry, run: Runner) {
  return withGenerator(entry, { verify: createVerify({ run }) });
}

type Step = { round: number; lang: Language; real: () => Promise<RunOutcome> };

/**
 * Runner con guion: numera las llamadas por ronda (3 por verify, en el orden js, go, java).
 * Si el guion devuelve undefined, ejecuta de verdad.
 */
export function scriptedRunner(
  script: (step: Step) => RunOutcome | Promise<RunOutcome> | undefined,
): Runner {
  let calls = 0;
  return (lang: Language, source: string, options?: RunOptions): Promise<RunOutcome> => {
    const round = Math.floor(calls++ / 3);
    const real = () => runInLanguage(lang, source, options);
    return Promise.resolve(script({ round, lang, real }) ?? real());
  };
}

/** Aprueba Big O con el pipeline real (modo fill) y lanza si no queda approved. */
export async function approveBigO(svc: Db, date: string, env = ENV) {
  const result = await generateForDate(
    { entry: bigO, date },
    {
      repo: new ChallengePublishingRepository(svc),
      env,
      log: captureLogger().logger,
      signal: new AbortController().signal,
    },
  );
  if (result.outcome !== 'approved') throw new Error(`big-o not approved: ${result.outcome}`);
  return result;
}
