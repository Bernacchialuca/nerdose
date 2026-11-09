import {
  GAME_IDS,
  challengeNumber,
  nextResetAt,
  secondsToReset,
  today,
  type GameId,
  type GameRegistry,
  type Locale,
} from '@nerdose/core';
import type { Player } from '@nerdose/db';
import type { Logger } from 'pino';

import type { GameplayRepository } from '@/domain/gameplay/gameplay.repository';
import type { ProgressService } from '@/domain/progress/progress.service';
import type { TodayCache } from '@/infra/cache/today-cache';
import type { WordList } from '@/infra/cache/word-list';
import type { Clock } from '@/shared/clock';

import type { ChallengesPublishRepository, TermsReadRepository } from './publishing.repository';
import type { PlayStatus, PublicChallengeStatus, Today, TodayGame } from './publishing.types';

type Deps = {
  repo: ChallengesPublishRepository;
  cache: Pick<TodayCache, 'reload' | 'find'>;
  wordList: Pick<WordList, 'reload'>;
  terms: TermsReadRepository;
  clock: Clock;
  launchDate: string;
  logger: Logger;
  games: GameRegistry;
  gameplay: Pick<GameplayRepository, 'findPlaysOfDay'>;
  progress: Pick<ProgressService, 'todayStreaks'>;
};

const COMPLETED: readonly PlayStatus[] = ['won', 'lost', 'voided'];

export class PublishingService {
  // Estado de single-flight por instancia (ADR-012: una sola instancia en producción).
  private currentDay: string | null = null;
  private inFlight: { day: string; promise: Promise<void> } | null = null;

  constructor(private readonly deps: Deps) {}

  async ensureToday(): Promise<void> {
    const day = today(this.deps.clock.now());
    while (this.currentDay !== day) {
      if (this.inFlight && this.inFlight.day !== day) {
        await this.inFlight.promise.catch(() => undefined);
        continue;
      }
      if (!this.inFlight) {
        const promise = this.publish(day).finally(() => {
          this.inFlight = null;
        });
        this.inFlight = { day, promise };
      }
      await this.inFlight.promise;
    }
  }

  private async publish(day: string): Promise<void> {
    const published = await this.deps.repo.publishApproved(day);
    for (const row of published) {
      this.deps.logger.info(
        {
          event: 'ChallengePublished',
          challenge_id: row.id,
          game_id: row.game_id,
          date: row.date,
          number: row.number,
        },
        'Challenge published',
      );
    }
    await this.deps.cache.reload(day);
    await this.deps.wordList.reload(this.deps.terms);
    this.currentDay = day;
  }

  async getToday(input: { player: Player | null; locale: Locale }): Promise<Today> {
    const now = this.deps.clock.now();
    const date = today(now);
    const number = challengeNumber(date, this.deps.launchDate);
    const { player, locale } = input;
    const registered = new Set<GameId>(this.deps.games.ids());

    const challengeStatus = (id: GameId): PublicChallengeStatus =>
      number === null || !registered.has(id)
        ? 'none'
        : (this.deps.cache.find(id)?.status ?? 'none');

    const [plays, streaks] = player
      ? await Promise.all([
          this.deps.gameplay.findPlaysOfDay(player.id, date),
          this.deps.progress.todayStreaks(player.id, date),
        ])
      : [[], { byGame: {}, global: { current: 0, max: 0 } }];

    const games: TodayGame[] = GAME_IDS.map((game_id) => {
      const challenge_status = challengeStatus(game_id);
      const play = plays.find((p) => p.gameId === game_id);
      const cached = this.deps.cache.find(game_id);
      let history_label: string | null = null;
      if (play && (play.status === 'won' || play.status === 'lost') && cached) {
        if (challenge_status !== 'none' && registered.has(game_id)) {
          const game = this.deps.games.get(game_id);
          history_label = game.historyLabel(game.result(cached.payload, play.state, locale));
        }
      }
      return {
        game_id,
        challenge_status,
        play_status: play?.status ?? null,
        history_label,
        current_streak: streaks.byGame[game_id] ?? 0,
      };
    });

    return {
      date,
      number,
      next_reset_at: nextResetAt(now).toISOString().replace('.000Z', 'Z'),
      seconds_to_reset: secondsToReset(now),
      has_session: player !== null,
      global_streak: streaks.global,
      completed_today: plays.filter((p) => COMPLETED.includes(p.status)).length,
      games,
    };
  }
}
