import {
  AppError,
  challengeNumber,
  today,
  type GameRegistry,
  type Locale,
  type MoveContext,
} from '@nerdose/core';
import type { Play, Player } from '@nerdose/db';
import type { Logger } from 'pino';

import type { ProgressService } from '@/domain/progress/progress.service';
import type { QualityRepository } from '@/domain/quality/quality.repository';
import type { TodayCache } from '@/infra/cache/today-cache';
import type { WordList } from '@/infra/cache/word-list';
import type { Clock } from '@/shared/clock';
import { playerRef } from '@/shared/player-ref';

import type { GameplayRepository } from './gameplay.repository';
import type {
  AcknowledgeVoidResponse,
  GameToday,
  MoveResponse,
  MoveTx,
  PlayView,
} from './gameplay.types';

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
      reports: Pick<QualityRepository, 'hasReported'>;
      progress: Pick<ProgressService, 'gameStatsView' | 'applyResult' | 'todayStreaks'>;
      runInTx: MoveTx;
      wordList: Pick<WordList, 'has'>;
      rejected: Pick<GameplayRepository, 'insertRejectedGuess'>;
      clock: Clock;
      launchDate: string;
    },
  ) {}

  async getToday(gameId: string, player: Player | null, locale: Locale): Promise<GameToday> {
    const { games, cache, repo, reports, progress, clock, launchDate } = this.deps;
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
      reported: false,
    };

    const challenge = number === null ? undefined : cache.find(game.id);
    if (!challenge) return { ...empty, challenge_status: 'none' };

    if (challenge.status === 'voided') {
      if (!player) return { ...empty, challenge_status: 'voided' };
      const [row, reported] = await Promise.all([
        repo.findPlay(player.id, challenge.id),
        reports.hasReported(player.id, challenge.id),
      ]);
      if (!row) return { ...empty, challenge_status: 'voided', reported };
      // ADR-006: con `voided` nunca salen `public_view` ni `result`.
      return {
        ...empty,
        challenge_status: 'voided',
        play: toPlayView(row),
        game_stats: await progress.gameStatsView(player.id, game, date),
        reported,
      };
    }

    if (!player) {
      return {
        ...empty,
        challenge_status: 'published',
        public_view: game.toPublic(challenge.payload, locale) as unknown,
      };
    }

    const [row, reported] = await Promise.all([
      repo.findPlay(player.id, challenge.id),
      reports.hasReported(player.id, challenge.id),
    ]);
    // `state` solo con Play en curso: el juego decide qué revela (ADR-006).
    const state = row?.status === 'in_progress' ? row.state : undefined;
    const public_view = game.toPublic(challenge.payload, locale, state) as unknown;
    const play = row ? toPlayView(row) : null;
    if (row && (row.status === 'won' || row.status === 'lost')) {
      return {
        ...empty,
        challenge_status: 'published',
        public_view,
        play,
        result: game.result(challenge.payload, row.state, locale) as unknown,
        game_stats: await progress.gameStatsView(player.id, game, date),
        reported,
      };
    }
    return { ...empty, challenge_status: 'published', public_view, play, reported };
  }

  async start(
    gameId: string,
    player: Player,
    challengeNum: number,
    log: Logger,
  ): Promise<{ play: PlayView }> {
    const { games, cache, runInTx, clock, launchDate } = this.deps;
    const game = games.get(gameId);
    const now = clock.now();
    if (challengeNum !== challengeNumber(today(now), launchDate)) {
      throw new AppError('challenge_expired');
    }
    const challenge = cache.get(game.id);
    if (challenge.status === 'voided') throw new AppError('challenge_voided');

    const events: Array<() => void> = [];
    const play = await runInTx(async ({ plays }) => {
      const locked = await plays.lockChallenge(challenge.id);
      if (locked?.status === 'voided') throw new AppError('challenge_voided');
      const { inserted } = await plays.insertPlayIfAbsent({
        playerId: player.id,
        challengeId: challenge.id,
        gameId: game.id,
        date: challenge.date,
        state: game.initState(challenge.payload, now) as unknown,
      });
      if (inserted) {
        events.push(() =>
          log.info(
            {
              event: 'PlayStarted',
              play_id: inserted.id,
              player_ref: playerRef(player.id),
              challenge_id: challenge.id,
            },
            'Play started',
          ),
        );
      }
      return inserted ?? (await plays.findPlay(player.id, challenge.id));
    });
    for (const emit of events) emit();
    return { play: toPlayView(play!) };
  }

  async move(
    gameId: string,
    player: Player,
    body: { challenge_number: number; move?: unknown },
    locale: Locale,
    log: Logger,
  ): Promise<MoveResponse> {
    const { games, cache, progress, runInTx, wordList, rejected, clock, launchDate } = this.deps;
    const game = games.get(gameId);
    const now = clock.now();
    if (body.challenge_number !== challengeNumber(today(now), launchDate)) {
      throw new AppError('challenge_expired');
    }
    const challenge = cache.get(game.id);
    if (challenge.status === 'voided') throw new AppError('challenge_voided');
    const parsed = game.moveSchema.safeParse(body.move);
    if (!parsed.success) throw new AppError('invalid_move');

    // Se crea por llamada: guarda la palabra rechazada de esta request.
    let rejectedWord: string | null = null;
    const ctx: MoveContext = {
      isValidWord: (w) => {
        const ok = wordList.has(w);
        if (!ok) rejectedWord = w.toUpperCase();
        return ok;
      },
      locale,
    };

    // Los eventos se emiten solo si la transacción confirmó.
    const events: Array<() => void> = [];
    let response: MoveResponse;
    try {
      response = await runInTx(async ({ plays, progress: pRepo, identity }) => {
        // El estado real del challenge manda sobre la cache (anulación concurrente).
        const locked = await plays.lockChallenge(challenge.id);
        if (locked?.status === 'voided') throw new AppError('challenge_voided');
        const { inserted } = await plays.insertPlayIfAbsent({
          playerId: player.id,
          challengeId: challenge.id,
          gameId: game.id,
          date: challenge.date,
          state: game.initState(challenge.payload, now) as unknown,
        });
        const play = (await plays.lockPlay(player.id, challenge.id))!;
        if (inserted) {
          events.push(() =>
            log.info(
              {
                event: 'PlayStarted',
                play_id: play.id,
                player_ref: playerRef(player.id),
                challenge_id: challenge.id,
              },
              'Play started',
            ),
          );
        }
        if (play.status === 'voided') throw new AppError('challenge_voided');
        if (play.status !== 'in_progress') throw new AppError('game_finished');

        const r = game.applyMove(challenge.payload, play.state, parsed.data, now, ctx);
        if ('error' in r) throw new AppError(r.error);

        if (!game.isFinished(r.state)) {
          const updated = await plays.updateState(play.id, r.state as unknown);
          events.push(() => log.debug({ event: 'MoveApplied', play_id: play.id }, 'Move applied'));
          return {
            feedback: r.feedback as unknown,
            play: toPlayView(updated),
            result: null,
            streaks: null,
            game_stats: null,
          };
        }

        const result = game.result(challenge.payload, r.state, locale) as unknown;
        const win = game.isWin(result as never);
        const score = game.score(result as never);
        const codeLanguage = game.codeLanguage(r.state);
        const closed = await plays.closePlay(play.id, {
          state: r.state as unknown,
          status: win ? 'won' : 'lost',
          result,
          score,
          finishedAt: now,
          codeLanguage,
        });
        const { streaks, gameStats } = await progress.applyResult(pRepo, {
          playerId: player.id,
          game,
          date: challenge.date,
          outcome: { status: closed.status as 'won' | 'lost', result },
        });
        if (codeLanguage !== null) {
          await identity.updatePreferences(player.id, { preferredCodeLanguage: codeLanguage });
        }
        events.push(
          () =>
            log.info(
              {
                event: 'PlayFinished',
                play_id: play.id,
                player_ref: playerRef(player.id),
                challenge_id: challenge.id,
                game_id: game.id,
                status: closed.status,
                score,
              },
              'Play finished',
            ),
          () =>
            log.info(
              {
                event: 'StreaksUpdated',
                player_ref: playerRef(player.id),
                game_id: game.id,
                current_streak: streaks.game.current,
                max_streak: streaks.game.max,
                global_streak: streaks.global.current,
                max_global_streak: streaks.global.max,
              },
              'Streaks updated',
            ),
        );
        return {
          feedback: r.feedback as unknown,
          play: toPlayView(closed),
          result,
          streaks,
          game_stats: gameStats,
        };
      });
    } catch (err) {
      if (err instanceof AppError && err.code === 'not_in_word_list' && rejectedWord !== null) {
        try {
          await rejected.insertRejectedGuess(rejectedWord, player.id);
        } catch (insertErr) {
          log.warn(
            { err: insertErr, event: 'GuessRejectedNotRecorded' },
            'Rejected guess not recorded',
          );
        }
        log.info(
          { event: 'GuessRejected', player_ref: playerRef(player.id), challenge_id: challenge.id },
          'Guess rejected',
        );
      }
      throw err;
    }
    for (const emit of events) emit();
    return response;
  }

  /** "Marcar como completado": Play `voided` + rachas, idempotente. */
  async acknowledgeVoid(
    gameId: string,
    player: Player,
    challengeNum: number,
    log: Logger,
  ): Promise<AcknowledgeVoidResponse> {
    const { games, cache, progress, runInTx, clock, launchDate } = this.deps;
    const game = games.get(gameId);
    const now = clock.now();
    const day = today(now);
    if (challengeNum !== challengeNumber(day, launchDate)) throw new AppError('challenge_expired');
    const challenge = cache.get(game.id);

    const events: Array<() => void> = [];
    const streaks = await runInTx(async ({ plays, progress: pRepo }) => {
      const locked = await plays.lockChallenge(challenge.id);
      if (locked?.status !== 'voided') throw new AppError('not_voided');
      const { inserted } = await plays.insertVoidedPlayIfAbsent({
        playerId: player.id,
        challengeId: challenge.id,
        gameId: game.id,
        date: challenge.date,
        finishedAt: now,
      });
      if (!inserted) return null;
      const applied = await progress.applyResult(pRepo, {
        playerId: player.id,
        game,
        date: challenge.date,
        outcome: { status: 'voided' },
      });
      events.push(
        () =>
          log.info(
            {
              event: 'PlayVoidAcknowledged',
              play_id: inserted.id,
              player_ref: playerRef(player.id),
              challenge_id: challenge.id,
              game_id: game.id,
            },
            'Play void acknowledged',
          ),
        () =>
          log.info(
            {
              event: 'StreaksUpdated',
              player_ref: playerRef(player.id),
              game_id: game.id,
              current_streak: applied.streaks.game.current,
              max_streak: applied.streaks.game.max,
              global_streak: applied.streaks.global.current,
              max_global_streak: applied.streaks.global.max,
            },
            'Streaks updated',
          ),
      );
      return applied.streaks;
    });
    for (const emit of events) emit();
    if (streaks) return { play: { status: 'voided' }, streaks };

    // Ya tenía Play: rachas vivas, sin escribir.
    const [gs, live] = await Promise.all([
      progress.gameStatsView(player.id, game, day),
      progress.todayStreaks(player.id, day),
    ]);
    return {
      play: { status: 'voided' },
      streaks: {
        game: { current: gs.current_streak, max: gs.max_streak },
        global: live.global,
      },
    };
  }
}
