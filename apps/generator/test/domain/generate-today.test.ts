import { challenges } from '@nerdose/db';
import { asc, eq } from 'drizzle-orm';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import { runGenerateToday } from '@/domain/challenge-publishing/fill.service';
import { generatorRegistry } from '@/games/registry';

import { BANK16, insertTerms } from '../helpers/bank';
import { setupTestDb } from '../helpers/db';
import { captureLogger } from '../helpers/logger';

const NOW = new Date('2026-12-01T12:00:00.000Z');
const t = setupTestDb();

function run(options: { nodeEnv?: 'development' | 'production'; launch?: string } = {}) {
  return runGenerateToday(
    { now: NOW, log: captureLogger().logger, signal: new AbortController().signal },
    {
      db: t.svc.db,
      env: {
        GENERATOR_SECRET: 'test-secret-0123456789abcdef0123456789',
        LAUNCH_DATE: options.launch ?? '2026-11-20',
        GENERATION_MAX_ATTEMPTS: 20,
      },
      registry: generatorRegistry,
      nodeEnv: options.nodeEnv ?? 'development',
    },
  );
}

const devdleRows = () =>
  t.owner.db
    .select()
    .from(challenges)
    .where(eq(challenges.gameId, 'devdle'))
    .orderBy(asc(challenges.date));

beforeEach(async () => {
  await t.reset();
  await insertTerms(t.owner.db, BANK16);
});
afterAll(() => t.cleanup());

describe('generate:today (solo dev)', () => {
  it('genera y aprueba el desafío de hoy, y nada más', async () => {
    const { summary, failed } = await run();
    expect(failed).toBe(false);
    expect(summary).toEqual({ generated: 1, approved: 1, rejected: 0, missing: 0 });
    const rows = await devdleRows();
    expect(rows.map((r) => [r.date, r.status, r.number])).toEqual([['2026-12-01', 'approved', 12]]);
  });

  it('es idempotente: si hoy ya está cubierto no genera', async () => {
    await run();
    const { summary } = await run();
    expect(summary).toEqual({ generated: 0, approved: 0, rejected: 0, missing: 0 });
    expect(await devdleRows()).toHaveLength(1);
  });

  it('se niega a correr en producción', async () => {
    await expect(run({ nodeEnv: 'production' })).rejects.toThrow(/production/);
    expect(await devdleRows()).toHaveLength(0);
  });

  it('se niega a correr antes de LAUNCH_DATE', async () => {
    await expect(run({ launch: '2026-12-05' })).rejects.toThrow(/LAUNCH_DATE/);
    expect(await devdleRows()).toHaveLength(0);
  });
});
