import { AppError, challengeNumber, today, type GameRegistry, type Locale } from '@nerdose/core';
import type { Play, Player } from '@nerdose/db';
import type { Logger } from 'pino';

import type { ProgressService } from '@/domain/progress/progress.service';
import type { TodayCache } from '@/infra/cache/today-cache';
import type { Clock } from '@/shared/clock';

import type { GameplayRepository } from './gameplay.repository';
import type { GameToday, PlayView } from './gameplay.types';

const toPlayView = (p: Play): PlayView => ({
  status: p.status,
  state: p.state,
  score: p.score,
  code_language: p.codeLanguage,
});

export class GameplayService {
  constructor(
    private readonly deps: {
      games: GameRegistry;
      cache: Pick<TodayCache, 'find' | 'get'>;
      repo: Pick<GameplayRepository, 'findPlay' | 'insertPlayIfAbsent'>;
      progress: Pick<ProgressService, 'gameStatsView'>;
      clock: Clock;
      launchDate: string;
    },
  ) {}

  async getToday(gameId: string, player: Player | null, locale: Locale): Promise<GameToday> {
    const { games, cache, repo, progress, clock, launchDate } = this.deps;
    const game = games.get(gameId);
    const date = today(clock.now());
    const number = challengeNumber(date, launchDate);
    const empty = {
      game_id: game.id,
      date,
      number,
      public_view: null,
      play: null,
      result: null,
      game_stats: null,
    };

    const challenge = number === null ? undefined : cache.find(game.id);
    if (!challenge) return { ...empty, challenge_status: 'none' };
    if (challenge.status === 'voided') return { ...empty, challenge_status: 'voided' };

    const public_view = game.toPublic(challenge.payload, locale) as unknown;
    if (!player) return { ...empty, challenge_status: 'published', public_view };

    const row = await repo.findPlay(player.id, challenge.id);
    const play = row ? toPlayView(row) : null;
    if (row && (row.status === 'won' || row.status === 'lost')) {
      return {
        ...empty,
        challenge_status: 'published',
        public_view,
        play,
        result: game.result(challenge.payload, row.state, locale) as unknown,
        game_stats: await progress.gameStatsView(player.id, game, date),
      };
    }
    return { ...empty, challenge_status: 'published', public_view, play };
  }

  async start(
    gameId: string,
    player: Player,
    challengeNum: number,
    log: Logger,
  ): Promise<{ play: PlayView }> {
    const { games, cache, repo, clock, launchDate } = this.deps;
    const game = games.get(gameId);
    const now = clock.now();
    if (challengeNum !== challengeNumber(today(now), launchDate)) {
      throw new AppError('challenge_expired');
    }
    const challenge = cache.get(game.id);
    if (challenge.status === 'voided') throw new AppError('challenge_voided');

    const { inserted } = await repo.insertPlayIfAbsent({
      playerId: player.id,
      challengeId: challenge.id,
      gameId: game.id,
      date: challenge.date,
      state: game.initState(challenge.payload, now) as unknown,
    });
    if (inserted) {
      log.info(
        {
          event: 'PlayStarted',
          play_id: inserted.id,
          player_id: player.id,
          challenge_id: challenge.id,
        },
        'Play started',
      );
    }
    const play = inserted ?? (await repo.findPlay(player.id, challenge.id));
    return { play: toPlayView(play!) };
  }
}
