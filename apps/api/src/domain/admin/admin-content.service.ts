import {
  challengeNumber,
  today,
  type Culprit,
  type GameId,
  type GameRegistry,
} from '@nerdose/core';

import type { Clock } from '@/shared/clock';
import { shiftDay } from '@/shared/day';

import type { AdminRepository } from './admin.repository';
import { syncSummarySchema } from './admin.schema';
import type {
  ContentStock,
  FailureView,
  GenerationFailureView,
  LastSync,
  RegenerationView,
  RejectedItem,
  UpcomingChallenge,
  UpcomingDay,
  UpcomingGame,
} from './admin.types';
import { resolveBankConsumers, type BankConsumers } from './bank-columns';
import { buildBankStock } from './bank-stock';

type Repo = Pick<
  AdminRepository,
  | 'findActiveFailures'
  | 'findApprovedBetween'
  | 'findLatestRequests'
  | 'findRejectedBankItems'
  | 'countBank'
  | 'findRejections'
  | 'findLastSuccessfulSync'
  | 'topRejectedGuesses'
>;

const FAILURE_WINDOW_DAYS = 14;

export class AdminContentService {
  private readonly banks: BankConsumers[];

  constructor(
    private readonly deps: { repo: Repo; games: GameRegistry; clock: Clock; launchDate: string },
  ) {
    // Un bankUsage desconocido hace fallar el arranque, como un id desconocido del registry.
    this.banks = resolveBankConsumers(deps.games);
  }

  /** Un payload ilegible no debe tumbar toda la grilla: sin culpables en vez de fallar. */
  private culpritsOf(row: { gameId: GameId; payload: unknown }): Culprit[] {
    try {
      return this.deps.games
        .get(row.gameId)
        .culprits(row.payload)
        .filter((c: Culprit) => typeof c.id === 'string');
    } catch {
      return [];
    }
  }

  private async activeFailures() {
    const day = today(this.deps.clock.now());
    return this.deps.repo.findActiveFailures(shiftDay(day, 1), shiftDay(day, FAILURE_WINDOW_DAYS));
  }

  async generationFailures(): Promise<{ failures: GenerationFailureView[] }> {
    const rows = await this.activeFailures();
    return {
      failures: rows.map((r) => ({
        game_id: r.gameId,
        date: r.date,
        attempts: r.attempts,
        last_reason: r.lastReason,
        updated_at: r.updatedAt.toISOString(),
      })),
    };
  }

  async upcoming(days: number): Promise<{ days: UpcomingDay[]; active_failures: number }> {
    const { repo, games, clock, launchDate } = this.deps;
    const day = today(clock.now());
    const dates: string[] = [];
    for (let i = 1; i <= days; i++) {
      const date = shiftDay(day, i);
      if (date >= launchDate) dates.push(date);
    }
    const [failures, approved] = await Promise.all([
      this.activeFailures(),
      dates.length
        ? repo.findApprovedBetween(dates[0]!, dates[dates.length - 1]!)
        : Promise.resolve([]),
    ]);
    const registered = games.ids();
    const rows = approved.filter((r) => registered.includes(r.gameId));

    const requests = await repo.findLatestRequests(rows.map((r) => r.id));
    const requestByChallenge = new Map(requests.map((r) => [r.challengeId, r]));

    // rejected_items: culprits por challenge, ids por banco y una consulta por banco.
    const culpritsById = new Map(rows.map((r) => [r.id, this.culpritsOf(r)] as const));
    const termIds = new Set<string>();
    const factIds = new Set<string>();
    for (const list of culpritsById.values()) {
      for (const c of list) (c.kind === 'term' ? termIds : factIds).add(c.id);
    }
    const rejected = await repo.findRejectedBankItems({
      termIds: [...termIds],
      factIds: [...factIds],
    });
    const reasonByKey = new Map(rejected.map((r) => [`${r.kind}|${r.id}`, r.rejectionReason]));

    const challengeByKey = new Map(rows.map((r) => [`${r.gameId}|${r.date}`, r]));
    const failureByKey = new Map(failures.map((f) => [`${f.gameId}|${f.date}`, f]));

    const cell = (gameId: GameId, date: string): UpcomingGame => {
      const key = `${gameId}|${date}`;
      const row = challengeByKey.get(key);
      if (row) {
        const rejectedItems: RejectedItem[] = [];
        for (const c of culpritsById.get(row.id) ?? []) {
          const reason = reasonByKey.get(`${c.kind}|${c.id}`);
          if (reason !== undefined) {
            rejectedItems.push({
              kind: c.kind,
              id: c.id,
              label: c.label,
              rejection_reason: reason,
            });
          }
        }
        const challenge: UpcomingChallenge = {
          id: row.id,
          status: 'approved',
          payload: row.payload,
          verification: row.verification,
          generator_version: row.generatorVersion,
          attempt: row.attempt,
          rejected_items: rejectedItems,
        };
        const req = requestByChallenge.get(row.id);
        const regeneration: RegenerationView | null =
          req && (req.status === 'pending' || req.status === 'failed')
            ? {
                request_id: req.id,
                status: req.status,
                error: req.error,
                requested_at: req.requestedAt.toISOString(),
                processed_at: req.processedAt ? req.processedAt.toISOString() : null,
              }
            : null;
        return { game_id: gameId, challenge, regeneration, failure: null };
      }
      const f = failureByKey.get(key);
      const failure: FailureView | null = f
        ? { attempts: f.attempts, last_reason: f.lastReason, updated_at: f.updatedAt.toISOString() }
        : null;
      return { game_id: gameId, challenge: null, regeneration: null, failure };
    };

    return {
      days: dates.map((date) => ({
        date,
        // Las fechas anteriores al lanzamiento ya se omitieron: el número existe.
        number: challengeNumber(date, launchDate) as number,
        games: registered.map((gameId) => cell(gameId, date)),
      })),
      active_failures: failures.length,
    };
  }

  async stock(): Promise<ContentStock> {
    const { repo, clock } = this.deps;
    const day = today(clock.now());
    const banks = await Promise.all(
      this.banks.map(async ({ bank, consumers }) => {
        const [counts, rejections] = await Promise.all([
          repo.countBank(
            bank,
            consumers.map((c) => ({
              column: c.column,
              cutoff: shiftDay(day, -c.usage.windowDays),
            })),
          ),
          repo.findRejections(bank),
        ]);
        return {
          ...buildBankStock({
            bank,
            approvedTotal: counts.approvedTotal,
            rejectedTotal: counts.rejectedTotal,
            available: counts.available,
            availableAll: counts.availableAll,
            consumers: consumers.map((c) => ({
              gameId: c.gameId,
              windowDays: c.usage.windowDays,
              itemsPerChallenge: c.usage.itemsPerChallenge,
            })),
          }),
          rejections,
        };
      }),
    );

    const run = await repo.findLastSuccessfulSync();
    let lastSync: LastSync | null = null;
    if (run) {
      // Falla fuerte si el summary o finished_at no son los esperados (convención orm).
      const summary = syncSummarySchema.parse(run.summary);
      if (!run.finishedAt) throw new Error('sync_banks success run without finished_at');
      lastSync = { finished_at: run.finishedAt.toISOString(), ...summary };
    }

    return {
      banks,
      last_sync: lastSync,
      top_rejected_guesses: await repo.topRejectedGuesses(50),
    };
  }
}
