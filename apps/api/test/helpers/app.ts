import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { GameRegistry } from '@nerdose/core';
import type { Db } from '@nerdose/db';
import type { Logger } from 'pino';

import { hashPassword, signAdminToken } from '@/domain/admin/admin-auth';
import { AdminContentService } from '@/domain/admin/admin-content.service';
import { AdminMetricsService } from '@/domain/admin/admin-metrics.service';
import { AdminRepository } from '@/domain/admin/admin.repository';
import { AdminService } from '@/domain/admin/admin.service';
import { GameplayRepository, moveTransaction } from '@/domain/gameplay/gameplay.repository';
import { GameplayService } from '@/domain/gameplay/gameplay.service';
import type { MoveTxRepos } from '@/domain/gameplay/gameplay.types';
import type { IdentityService } from '@/domain/identity/identity.service';
import { MyStatsService } from '@/domain/progress/my-stats.service';
import { QualityRepository } from '@/domain/quality/quality.repository';
import { QualityService } from '@/domain/quality/quality.service';
import type { AlertThresholds, VoidTxRepos } from '@/domain/quality/quality.types';
import { VoidService } from '@/domain/quality/void.service';
import { ProgressRepository } from '@/domain/progress/progress.repository';
import { ProgressService } from '@/domain/progress/progress.service';
import {
  PublishingRepository,
  type ChallengesPublishRepository,
  type ChallengesReadRepository,
  type TermsReadRepository,
} from '@/domain/publishing/publishing.repository';
import { PublishingService } from '@/domain/publishing/publishing.service';
import {
  RegenerationService,
  type RegenerationRepo,
} from '@/domain/publishing/regeneration.service';
import { games as defaultGames } from '@/games/registry';
import { buildApp } from '@/http/app';
import type { AppDeps } from '@/http/types';
import { TodayCache } from '@/infra/cache/today-cache';
import { WordList } from '@/infra/cache/word-list';
import { systemClock, type Clock } from '@/shared/clock';

import { captureLogger } from './logger';

export const TEST_ADMIN_PASSWORD = 'nerdose-admin-test';
export const TEST_ADMIN_PASSWORD_HASH = await hashPassword(TEST_ADMIN_PASSWORD);
export const TEST_ADMIN_JWT_SECRET = 'test-admin-jwt-secret-0123456789-abcdef';

export const TEST_CONFIG = {
  WEB_ORIGIN: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174',
  TRUST_PROXY_HEADER: 'x-forwarded-for',
  LAUNCH_DATE: '2026-11-24',
  ADMIN_PASSWORD_HASH: TEST_ADMIN_PASSWORD_HASH,
  ADMIN_JWT_SECRET: TEST_ADMIN_JWT_SECRET,
};

export const ADMIN_HEADERS = {
  Origin: 'http://localhost:5174',
  'Content-Type': 'application/json',
};

/** Token de admin válido firmado con el secreto de test (`nowSeconds` por defecto: ahora). */
export async function adminToken(nowSeconds?: number): Promise<string> {
  return (await signAdminToken(TEST_ADMIN_JWT_SECRET, nowSeconds)).token;
}

export async function adminAuth(nowSeconds?: number) {
  return { Authorization: `Bearer ${await adminToken(nowSeconds)}` };
}

export const DEFAULT_THRESHOLDS: AlertThresholds = { count: 3, ratio: 0.05, ratioMinCount: 2 };

export const MUTATION_HEADERS = {
  Origin: 'http://localhost:5173',
  'Content-Type': 'application/json',
};

export const TEST_ENV = {
  LAUNCH_DATE: '2026-11-24',
  WEB_ORIGIN: 'http://localhost:5173',
  ADMIN_ORIGIN: 'http://localhost:5174',
  ADMIN_PASSWORD_HASH: TEST_ADMIN_PASSWORD_HASH,
  ADMIN_JWT_SECRET: TEST_ADMIN_JWT_SECRET,
};

export const stubIdentity = new Proxy({} as IdentityService, {
  get: () => () => {
    throw new Error('identity no configurada en este test');
  },
});

const emptyRepos = {
  read: { findTodayVisible: async () => [] } satisfies ChallengesReadRepository,
  publish: { publishApproved: async () => [] } satisfies ChallengesPublishRepository,
  terms: { findApprovedTerms: async () => [] } satisfies TermsReadRepository,
};

/** Servicios en memoria que no tocan la base (cache vacía, repos vacíos). */
export function buildMemoryServices(opts: { clock?: Clock; logger: Logger }) {
  const games = defaultGames;
  const clock = opts.clock ?? systemClock;
  const cache = new TodayCache(emptyRepos.read);
  const gameplayRepo = {
    findPlay: async () => null,
    findPlaysOfDay: async () => [],
    insertPlayIfAbsent: async () => ({ inserted: null }),
  };
  const progress = new ProgressService({
    repo: {
      findGameStats: async () => null,
      findAllGameStats: async () => [],
      findPlayerStats: async () => null,
      prevActiveDays: async () => ({ byGame: {}, global: null }),
    },
  });
  const publishing = new PublishingService({
    repo: emptyRepos.publish,
    cache,
    wordList: { reload: async () => undefined },
    terms: emptyRepos.terms,
    clock,
    launchDate: TEST_CONFIG.LAUNCH_DATE,
    logger: opts.logger,
    games,
    gameplay: gameplayRepo,
    progress,
  });
  const gameplay = new GameplayService({
    games,
    cache,
    repo: gameplayRepo,
    reports: { hasReported: async () => false },
    progress,
    runInTx: async (fn) =>
      fn({
        plays: {
          lockChallenge: async () => null,
          findPlay: async () => null,
          insertVoidedPlayIfAbsent: async () => ({ inserted: null }),
          insertPlayIfAbsent: async () => ({ inserted: null }),
          lockPlay: async () => null,
          updateState: async () => {
            throw new Error('sin base en este test');
          },
          closePlay: async () => {
            throw new Error('sin base en este test');
          },
        },
        progress: {
          prevActiveDays: async () => ({ byGame: {}, global: null }),
          lockGameStats: async () => {
            throw new Error('sin base en este test');
          },
          lockPlayerStats: async () => {
            throw new Error('sin base en este test');
          },
          saveGameStats: async () => undefined,
          savePlayerStats: async () => undefined,
        },
        identity: {
          updatePreferences: async () => {
            throw new Error('sin base en este test');
          },
        },
      }),
    wordList: { has: () => true },
    rejected: { insertRejectedGuess: async () => undefined },
    clock,
    launchDate: TEST_CONFIG.LAUNCH_DATE,
  });
  const quality = {
    report: async (): Promise<{ report_id: string }> => {
      throw new Error('sin base en este test');
    },
  };
  const admin = new AdminService({
    passwordHash: TEST_CONFIG.ADMIN_PASSWORD_HASH,
    jwtSecret: TEST_CONFIG.ADMIN_JWT_SECRET,
    clock,
    repo: {
      listReportsByStatus: async () => [],
      findChallengesByIds: async () => [],
      closeReportIfOpen: async () => null,
      reportExists: async () => false,
    },
    games,
  });
  const voids = {
    void: async (): Promise<{ challenge_id: string; affected_plays: number }> => {
      throw new Error('sin base en este test');
    },
  };
  const adminContent = new AdminContentService({
    repo: {
      findActiveFailures: async () => [],
      findApprovedBetween: async () => [],
      findLatestRequests: async () => [],
      findRejectedBankItems: async () => [],
      countBank: async () => ({
        approvedTotal: 0,
        rejectedTotal: 0,
        available: [],
        availableAll: 0,
      }),
      findRejections: async () => [],
      findLastSuccessfulSync: async () => null,
      topRejectedGuesses: async () => [],
    },
    games,
    clock,
    launchDate: TEST_CONFIG.LAUNCH_DATE,
  });
  const adminMetrics = new AdminMetricsService({
    repo: {
      metricsDailyPlayers: async () => [],
      metricsRetention: async () => [],
      metricsStreakDistribution: async () => [],
      metricsChallengeQuality: async () => [],
      playsSummary: async () => ({ uniquePlayers: 0, completed: 0 }),
    },
    activeDays: { prevActiveDays: async () => ({ byGame: {}, global: null }) },
    clock,
  });
  const myStats = new MyStatsService({
    repo: {
      findPlayerStats: async () => null,
      findAllGameStats: async () => [],
      prevActiveDays: async () => ({ byGame: {}, global: null }),
      heatmap: async () => [],
      historyPage: async () => [],
    },
    games,
    clock,
  });
  const regeneration = {
    regenerate: async (): Promise<{
      request_id: string;
      status: 'pending';
      requested_at: string;
    }> => {
      throw new Error('sin base en este test');
    },
  };
  return {
    publishing,
    gameplay,
    cache,
    progress,
    quality,
    admin,
    voids,
    adminContent,
    adminMetrics,
    myStats,
    regeneration,
  };
}

export async function tempWordList(words: string[] = ['CACHE', 'REACT']) {
  const dir = mkdtempSync(join(tmpdir(), 'nerdose-words-'));
  const path = join(dir, 'words.txt');
  writeFileSync(path, `${words.join('\n')}\n`);
  return WordList.load(path);
}

type Dbs = {
  api: { db: Db };
  identity(): IdentityService;
};

/** Servicios reales con el rol api (para los tests de integración HTTP). */
export async function buildDbServices(
  dbs: Dbs,
  opts: {
    logger: Logger;
    clock?: Clock;
    gameplayRepo?: Pick<GameplayRepository, 'findPlay' | 'findPlaysOfDay' | 'insertPlayIfAbsent'>;
    progressRepo?: ConstructorParameters<typeof ProgressService>[0]['repo'];
    /** Envuelve los repos de la transacción (p. ej. para forzar una falla en el cierre). */
    wrapTxRepos?: (r: MoveTxRepos) => MoveTxRepos;
    thresholds?: AlertThresholds;
    /** Envuelve los repos de la transacción de la anulación (p. ej. para forzar una falla). */
    wrapVoidRepos?: (r: VoidTxRepos) => VoidTxRepos;
    /** Envuelve el repo de la transacción de regeneración (p. ej. para que `notify` lance). */
    wrapRegenerationRepo?: (r: RegenerationRepo) => RegenerationRepo;
    /** Registry de juegos (por defecto el real); permite inyectar un juego de prueba. */
    games?: GameRegistry;
  },
) {
  const games = opts.games ?? defaultGames;
  const clock = opts.clock ?? systemClock;
  const publishingRepo = new PublishingRepository(dbs.api.db);
  const cache = new TodayCache(publishingRepo);
  const wordList = await tempWordList();
  const gameplayRepo = opts.gameplayRepo ?? new GameplayRepository(dbs.api.db);
  const progress = new ProgressService({
    repo: opts.progressRepo ?? new ProgressRepository(dbs.api.db),
  });
  const publishing = new PublishingService({
    repo: publishingRepo,
    cache,
    wordList,
    terms: publishingRepo,
    clock,
    launchDate: TEST_CONFIG.LAUNCH_DATE,
    logger: opts.logger,
    games,
    gameplay: gameplayRepo,
    progress,
  });
  const baseTx = moveTransaction(dbs.api.db);
  const wrap = opts.wrapTxRepos;
  const gameplay = new GameplayService({
    games,
    cache,
    repo: gameplayRepo,
    reports: new QualityRepository(dbs.api.db),
    progress,
    runInTx: wrap ? (fn) => baseTx((r) => fn(wrap(r))) : baseTx,
    wordList,
    rejected: new GameplayRepository(dbs.api.db),
    clock,
    launchDate: TEST_CONFIG.LAUNCH_DATE,
  });
  const db = dbs.api.db;
  const quality = new QualityService({
    games,
    runInTx: (fn) => db.transaction((tx) => fn(new QualityRepository(tx))),
    clock,
    thresholds: opts.thresholds ?? DEFAULT_THRESHOLDS,
  });
  const wrapVoid = opts.wrapVoidRepos;
  const admin = new AdminService({
    passwordHash: TEST_CONFIG.ADMIN_PASSWORD_HASH,
    jwtSecret: TEST_CONFIG.ADMIN_JWT_SECRET,
    clock,
    repo: new AdminRepository(db),
    games,
  });
  const voids = new VoidService({
    games,
    runInTx: (fn) =>
      db.transaction((tx) => {
        const repos = { quality: new QualityRepository(tx), progress: new ProgressRepository(tx) };
        return fn(wrapVoid ? wrapVoid(repos) : repos);
      }),
    cache,
    progress,
    clock,
  });
  const wrapRegen = opts.wrapRegenerationRepo;
  const adminContent = new AdminContentService({
    repo: new AdminRepository(db),
    games,
    clock,
    launchDate: TEST_CONFIG.LAUNCH_DATE,
  });
  const adminMetrics = new AdminMetricsService({
    repo: new AdminRepository(db),
    activeDays: new ProgressRepository(db),
    clock,
  });
  const myStats = new MyStatsService({ repo: new ProgressRepository(db), games, clock });
  const regeneration = new RegenerationService({
    runInTx: (fn) =>
      db.transaction((tx) => {
        const repo = new PublishingRepository(tx);
        return fn(wrapRegen ? wrapRegen(repo) : repo);
      }),
    clock,
  });
  return {
    identity: dbs.identity(),
    publishing,
    gameplay,
    quality,
    progress,
    cache,
    wordList,
    admin,
    voids,
    adminContent,
    adminMetrics,
    myStats,
    regeneration,
  };
}

export function buildTestApp(
  overrides: Partial<Omit<AppDeps, 'logger'>> & { logger?: Logger } = {},
) {
  const captured = captureLogger();
  const logger = overrides.logger ?? captured.logger;
  const memory = buildMemoryServices({ logger });
  const app = buildApp({
    logger,
    health: overrides.health ?? { check: async () => ({ status: 'ok', db: 'ok' }) },
    identity: overrides.identity ?? stubIdentity,
    config: overrides.config ?? TEST_CONFIG,
    publishing: overrides.publishing ?? memory.publishing,
    gameplay: overrides.gameplay ?? memory.gameplay,
    quality: overrides.quality ?? memory.quality,
    admin: overrides.admin ?? memory.admin,
    voids: overrides.voids ?? memory.voids,
    adminContent: overrides.adminContent ?? memory.adminContent,
    adminMetrics: overrides.adminMetrics ?? memory.adminMetrics,
    myStats: overrides.myStats ?? memory.myStats,
    regeneration: overrides.regeneration ?? memory.regeneration,
  });
  return { app, lines: captured.lines };
}

/** App con servicios reales (rol api) y logger capturado. */
export async function buildDbApp(
  dbs: Dbs,
  opts: Omit<Parameters<typeof buildDbServices>[1], 'logger'> = {},
) {
  const captured = captureLogger();
  const services = await buildDbServices(dbs, { ...opts, logger: captured.logger });
  const app = buildApp({
    logger: captured.logger,
    health: { check: async () => ({ status: 'ok', db: 'ok' }) },
    identity: services.identity,
    config: TEST_CONFIG,
    publishing: services.publishing,
    gameplay: services.gameplay,
    quality: services.quality,
    admin: services.admin,
    voids: services.voids,
    adminContent: services.adminContent,
    adminMetrics: services.adminMetrics,
    myStats: services.myStats,
    regeneration: services.regeneration,
  });
  return { app, lines: captured.lines, ...services };
}
