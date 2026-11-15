import type { Db } from '@nerdose/db';
import type { BugHuntPayload, BugHuntTestCase } from '@nerdose/game-bug-hunt/definition';
import { createVerify, type Runner } from '@nerdose/game-bug-hunt/generator';
import { runInLanguage, type Language, type RunOutcome } from '@nerdose/polyglot';

import { ChallengePublishingRepository } from '@/domain/challenge-publishing/challenge-publishing.repository';
import { generateForDate } from '@/domain/challenge-publishing/generate';
import { createGeneratorRegistry, generatorRegistry, type GeneratorEntry } from '@/games/registry';

import { captureLogger } from './logger';
import { ENV } from './regeneration';
import { withGenerator } from './registry';

export const bugHunt = generatorRegistry.get('bug-hunt');
export const bugHuntOnly = createGeneratorRegistry([bugHunt]);

export const BH_CHECKS = [
  'texts_bilingual',
  'code_shape',
  'lines_consistent',
  'tests_consistent',
  'variety_combo',
  'run_correct_js',
  'run_correct_go',
  'run_correct_java',
  'run_mutant_js',
  'run_mutant_go',
  'run_mutant_java',
  'correct_agrees',
  'mutant_agrees',
];

export function withBugHuntRunner(entry: GeneratorEntry, run: Runner) {
  return withGenerator(entry, { verify: createVerify({ run }) });
}

type Variant = 'correct' | 'mutant';
type Step = { round: number; variant: Variant; lang: Language; real: () => Promise<RunOutcome> };

/** Por lenguaje, correcta y mutada van en secuencia: el orden global de las mutadas no es estable. */
export function scriptedBugHuntRunner(
  script: (step: Step) => RunOutcome | Promise<RunOutcome> | undefined,
): Runner {
  const calls: Record<Language, number> = { js: 0, go: 0, java: 0 };
  return (lang, source, options) => {
    const i = calls[lang]++;
    const step: Step = {
      round: Math.floor(i / 2),
      variant: i % 2 === 0 ? 'correct' : 'mutant',
      lang,
      real: () => runInLanguage(lang, source, options),
    };
    return Promise.resolve(script(step) ?? step.real());
  };
}

export function countingRunner() {
  let n = 0;
  const run: Runner = (lang, source, options) => {
    n++;
    return runInLanguage(lang, source, options);
  };
  return { run, calls: () => n };
}

/** Aplica `mutate` solo al primer candidato que genera la entrada. */
export function firstCandidate(
  entry: GeneratorEntry,
  mutate: (p: BugHuntPayload) => BugHuntPayload,
) {
  const base = entry.generator.generate as (
    i: Parameters<typeof entry.generator.generate>[0],
  ) => BugHuntPayload;
  let n = 0;
  return withGenerator(entry, {
    generate: (input) => {
      const p = base(input);
      return n++ === 0 ? mutate(p) : p;
    },
  });
}

const size = (t: BugHuntTestCase) =>
  (t.input as unknown[]).reduce<number>((s, a) => s + (Array.isArray(a) ? a.length : 1), 0);

export function equivalentOf(p: BugHuntPayload): BugHuntPayload {
  const tests = p.tests.map((t) => ({ ...t, actual: t.expected }));
  const bySize = [...tests].sort((a, b) => size(a) - size(b));
  return {
    ...p,
    tests,
    failing_test: bySize[0]!,
    visible_tests: bySize.slice(1, 4).map(({ input, expected }) => ({ input, expected })),
  };
}

export function onePassingOf(p: BugHuntPayload): BugHuntPayload {
  const keep = JSON.stringify(p.visible_tests[0]!.input);
  const flip = (v: BugHuntTestCase['expected']) =>
    (typeof v === 'boolean' ? !v : (v as number) + 1000) as BugHuntTestCase['expected'];
  return {
    ...p,
    tests: p.tests.map((t) =>
      t.actual === t.expected && JSON.stringify(t.input) !== keep
        ? { ...t, actual: flip(t.expected) }
        : t,
    ),
  };
}

/** Suma 1 al último valor de la salida; si la ejecución falló, no enmascara nada. */
export const bump = (o: RunOutcome): RunOutcome =>
  o.ok
    ? { ...o, stdout: o.stdout.replace(/(-?\d+)\n$/, (_, v: string) => `${Number(v) + 1}\n`) }
    : o;

/** Aprueba Bug Hunt con el pipeline real (modo fill) y lanza si no queda approved. */
export async function approveBugHunt(svc: Db, date: string, env = ENV) {
  const result = await generateForDate(
    { entry: bugHunt, date },
    {
      repo: new ChallengePublishingRepository(svc),
      env,
      log: captureLogger().logger,
      signal: new AbortController().signal,
    },
  );
  if (result.outcome !== 'approved') throw new Error(`bug-hunt not approved: ${result.outcome}`);
  return result;
}
