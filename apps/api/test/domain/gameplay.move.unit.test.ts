import { AppError } from '@nerdose/core';
import { scoreGuess } from '@nerdose/game-devdle/definition';
import { grepGrid } from '@nerdose/game-grep-grid/definition';
import { describe, expect, it, vi } from 'vitest';

import { GameplayService } from '@/domain/gameplay/gameplay.service';
import type { MoveTx, MoveTxRepos } from '@/domain/gameplay/gameplay.types';
import { games } from '@/games/registry';

import { CODE_PAYLOAD, codeRegistry } from '../helpers/code-game';
import { PAYLOAD } from '../helpers/db';
import { GG_PAYLOAD, found, selectWord } from '../helpers/grep-grid';

const NOW = new Date('2026-12-01T10:00:00Z');
const player = { id: 'player-1' } as never;
const G = (g: string) => ({ guess: g, marks: scoreGuess('MERGE', g) });

function setup(
  opts: {
    cache?: { get: () => unknown };
    play?: Record<string, unknown>;
    has?: (w: string) => boolean;
    runInTx?: (repos: MoveTxRepos) => MoveTx;
    insertRejected?: () => Promise<void>;
    inserted?: boolean;
    challengeStatus?: string;
    games?: typeof games;
  } = {},
) {
  const calls = {
    lockChallenge: vi.fn(async () => ({ id: 'c1', status: opts.challengeStatus ?? 'published' })),
    updateState: vi.fn(async (_id: string, state: unknown) => ({
      status: 'in_progress',
      state,
      score: null,
      codeLanguage: null,
    })),
    closePlay: vi.fn(async (_id: string, v: Record<string, unknown>) => ({
      status: v.status,
      state: v.state,
      score: v.score,
      codeLanguage: v.codeLanguage,
    })),
    updatePreferences: vi.fn(async () => null),
    applyResult: vi.fn(async () => ({
      streaks: { game: { current: 1, max: 1 }, global: { current: 1, max: 1 } },
      gameStats: { game_id: 'devdle' },
    })),
    runInTx: vi.fn(),
  };
  const repos = {
    plays: {
      lockChallenge: calls.lockChallenge,
      findPlay: async () => null,
      insertVoidedPlayIfAbsent: async () => ({ inserted: null }),
      insertPlayIfAbsent: async () => ({
        inserted: opts.inserted ? ({ id: 'play-1' } as never) : null,
      }),
      lockPlay: async () => ({
        id: 'play-1',
        status: 'in_progress',
        state: { guesses: [G('REACT'), G('CACHE'), G('REACT')] },
        ...opts.play,
      }),
      updateState: calls.updateState,
      closePlay: calls.closePlay,
    },
    progress: {} as never,
    identity: { updatePreferences: calls.updatePreferences },
  } as unknown as MoveTxRepos;
  const runInTx: MoveTx = opts.runInTx
    ? opts.runInTx(repos)
    : ((async (fn: (r: MoveTxRepos) => Promise<unknown>) => {
        calls.runInTx();
        return fn(repos);
      }) as MoveTx);
  const rejected = { insertRejectedGuess: vi.fn(opts.insertRejected ?? (async () => undefined)) };
  const service = new GameplayService({
    games: opts.games ?? games,
    cache: (opts.cache ?? {
      get: () => ({
        id: 'c1',
        game_id: 'devdle',
        date: '2026-12-01',
        number: 8,
        status: 'published',
        payload: PAYLOAD,
      }),
    }) as never,
    repo: {} as never,
    reports: {} as never,
    progress: { gameStatsView: vi.fn(), applyResult: calls.applyResult } as never,
    runInTx,
    wordList: { has: opts.has ?? ((w: string) => w === 'REACT' || w === 'CACHE') },
    rejected,
    clock: { now: () => NOW },
    launchDate: '2026-11-24',
  });
  const log = { info: vi.fn(), warn: vi.fn(), debug: vi.fn() };
  return {
    service,
    calls,
    rejected,
    log,
    run: (gameId: string, num: number, move: unknown) =>
      service.move(gameId, player, { challenge_number: num, move }, 'es', log as never),
  };
}

describe('GameplayService.move (unit)', () => {
  it('TS-43 orden de validaciones, sin abrir transacción', async () => {
    const throwing = (code: string) => ({
      get: () => {
        throw new AppError(code as never);
      },
    });
    const a = setup();
    await expect(a.run('foo', 1, { guess: 'REACT' })).rejects.toMatchObject({ code: 'not_found' });
    const b = setup({ cache: throwing('no_challenge_today') });
    await expect(b.run('devdle', 1, { guess: 'REACT' })).rejects.toMatchObject({
      code: 'challenge_expired',
    });
    const c = setup({ cache: throwing('no_challenge_today') });
    await expect(c.run('devdle', 8, { guess: 'REACT' })).rejects.toMatchObject({
      code: 'no_challenge_today',
    });
    const d = setup({
      cache: { get: () => ({ id: 'c', status: 'voided', date: '2026-12-01', payload: PAYLOAD }) },
    });
    await expect(d.run('devdle', 8, {})).rejects.toMatchObject({ code: 'challenge_voided' });
    const e = setup();
    await expect(e.run('devdle', 8, {})).rejects.toMatchObject({ code: 'invalid_move' });
    for (const s of [a, b, c, d, e]) expect(s.calls.runInTx).not.toHaveBeenCalled();
  });

  it('TS-44 ctx.isValidWord usa la WordList y registra la palabra rechazada', async () => {
    const s = setup();
    await expect(s.run('devdle', 8, { guess: 'ZZZZZ' })).rejects.toMatchObject({
      code: 'not_in_word_list',
    });
    expect(s.rejected.insertRejectedGuess).toHaveBeenCalledWith('ZZZZZ', 'player-1');
    const ok = setup();
    await ok.run('devdle', 8, { guess: 'REACT' });
    expect(ok.rejected.insertRejectedGuess).not.toHaveBeenCalled();
  });

  it('TS-6 si el registro del rechazo falla: warn y misma respuesta', async () => {
    const s = setup({
      insertRejected: async () => {
        throw new Error('db down');
      },
    });
    await expect(s.run('devdle', 8, { guess: 'ZZZZZ' })).rejects.toMatchObject({
      code: 'not_in_word_list',
      status: 422,
    });
    expect(s.log.warn).toHaveBeenCalledWith(
      expect.objectContaining({ event: 'GuessRejectedNotRecorded', err: expect.any(Error) }),
      expect.any(String),
    );
  });

  it('TS-45 los logs de dominio se emiten solo después del COMMIT', async () => {
    const s = setup({
      play: { state: { guesses: [G('REACT'), G('CACHE'), G('REACT')] } },
      runInTx: (repos) =>
        (async (fn: (r: MoveTxRepos) => Promise<unknown>) => {
          await fn(repos);
          throw new Error('commit failed');
        }) as MoveTx,
    });
    await expect(s.run('devdle', 8, { guess: 'MERGE' })).rejects.toThrow('commit failed');
    const events = s.log.info.mock.calls.map((c) => (c[0] as { event: string }).event);
    expect(events).not.toContain('PlayFinished');
    expect(events).not.toContain('StreaksUpdated');
  });

  it('game_finished no llama a updateState, closePlay ni applyResult', async () => {
    const s = setup({ play: { status: 'won' } });
    await expect(s.run('devdle', 8, { guess: 'REACT' })).rejects.toMatchObject({
      code: 'game_finished',
    });
    expect(s.calls.updateState).not.toHaveBeenCalled();
    expect(s.calls.closePlay).not.toHaveBeenCalled();
    expect(s.calls.applyResult).not.toHaveBeenCalled();
  });

  it('jugada que no cierra: updateState sí, closePlay y applyResult no', async () => {
    const s = setup();
    const res = await s.run('devdle', 8, { guess: 'REACT' });
    expect(s.calls.updateState).toHaveBeenCalledOnce();
    expect(s.calls.closePlay).not.toHaveBeenCalled();
    expect(s.calls.applyResult).not.toHaveBeenCalled();
    expect(res).toMatchObject({ result: null, streaks: null, game_stats: null });
  });

  it('cierre: closePlay won score 4 y applyResult con outcome won', async () => {
    const s = setup({ inserted: true });
    const res = await s.run('devdle', 8, { guess: 'MERGE' });
    expect(s.calls.closePlay).toHaveBeenCalledWith(
      'play-1',
      expect.objectContaining({ status: 'won', score: 4, finishedAt: NOW }),
    );
    expect(s.calls.applyResult).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        outcome: expect.objectContaining({ status: 'won' }),
        date: '2026-12-01',
      }),
    );
    expect(res.streaks).toEqual({ game: { current: 1, max: 1 }, global: { current: 1, max: 1 } });
    expect(res.game_stats).toEqual({ game_id: 'devdle' });
    const events = s.log.info.mock.calls.map((c) => (c[0] as { event: string }).event);
    expect(events).toEqual(['PlayStarted', 'PlayFinished', 'StreaksUpdated']);
  });
  it('TS-26 ctx.locale llega a applyMove y feedback.definition sale en ese idioma', async () => {
    const s = setup({
      cache: {
        get: () => ({
          id: 'c',
          game_id: 'grep-grid',
          status: 'published',
          date: '2026-12-01',
          payload: GG_PAYLOAD,
        }),
      },
      play: { state: found() },
    });
    const spy = vi.spyOn(grepGrid, 'applyMove');
    try {
      const res = await s.service.move(
        'grep-grid',
        player,
        { challenge_number: 8, move: selectWord('DOCKER') },
        'en',
        s.log as never,
      );
      const ctx = spy.mock.calls[0]![4];
      expect(ctx.locale).toBe('en');
      expect(typeof ctx.isValidWord).toBe('function');
      expect(res.feedback).toMatchObject({ definition: 'definition of DOCKER' });
    } finally {
      spy.mockRestore();
    }
  });

  it('challenge voided en la base: challenge_voided sin crear Play', async () => {
    const s = setup({ challengeStatus: 'voided' });
    await expect(s.run('devdle', 8, { guess: 'REACT' })).rejects.toMatchObject({
      code: 'challenge_voided',
    });
    expect(s.calls.lockChallenge).toHaveBeenCalledOnce();
  });

  it('Play voided: challenge_voided y no game_finished', async () => {
    const s = setup({ play: { status: 'voided' } });
    await expect(s.run('devdle', 8, { guess: 'REACT' })).rejects.toMatchObject({
      code: 'challenge_voided',
    });
    expect(s.calls.updateState).not.toHaveBeenCalled();
  });

  it('TS-13 cierre con codeLanguage: closePlay con lenguaje y updatePreferences después de applyResult (S-042 TS-13)', async () => {
    const s = setup({
      games: codeRegistry,
      play: { state: {} },
      cache: {
        get: () => ({
          id: 'c1',
          game_id: 'big-o',
          date: '2026-12-01',
          number: 8,
          status: 'published',
          payload: CODE_PAYLOAD,
        }),
      },
    });
    const res = await s.service.move(
      'big-o',
      player,
      { challenge_number: 8, move: { language: 'java', option: 'o_n_log_n' } },
      'es',
      s.log as never,
    );
    expect(s.calls.closePlay).toHaveBeenCalledWith(
      'play-1',
      expect.objectContaining({ status: 'won', score: 1, codeLanguage: 'java' }),
    );
    expect(s.calls.updatePreferences).toHaveBeenCalledOnce();
    expect(s.calls.updatePreferences).toHaveBeenCalledWith('player-1', {
      preferredCodeLanguage: 'java',
    });
    expect(s.calls.updatePreferences.mock.invocationCallOrder[0]!).toBeGreaterThan(
      s.calls.applyResult.mock.invocationCallOrder[0]!,
    );
    expect(res.play.code_language).toBe('java');
  });

  it('TS-14 cierre de Devdle: codeLanguage null y sin updatePreferences (S-042 TS-14)', async () => {
    const s = setup();
    const res = await s.run('devdle', 8, { guess: 'MERGE' });
    expect(s.calls.closePlay).toHaveBeenCalledWith(
      'play-1',
      expect.objectContaining({ codeLanguage: null }),
    );
    expect(s.calls.updatePreferences).not.toHaveBeenCalled();
    expect(res.play.code_language).toBeNull();
  });

  it('TS-15 jugada que no cierra: sin closePlay ni updatePreferences, code_language null (S-042 TS-15)', async () => {
    const s = setup();
    const res = await s.run('devdle', 8, { guess: 'REACT' });
    expect(s.calls.updateState).toHaveBeenCalled();
    expect(s.calls.closePlay).not.toHaveBeenCalled();
    expect(s.calls.updatePreferences).not.toHaveBeenCalled();
    expect(res.play).toEqual({
      status: 'in_progress',
      state: { guesses: [G('REACT'), G('CACHE'), G('REACT'), G('REACT')] },
      score: null,
      code_language: null,
    });
  });
});
