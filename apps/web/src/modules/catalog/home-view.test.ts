import { GAME_IDS } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import {
  todayBeforeLaunchFixture,
  todayFirstVisitFixture,
  todayFixture,
  todayNoChallengesFixture,
} from '@/test/fixtures/today';

import { deriveHomeView } from './home-view';
import type { HomeView } from './home-view';

const base = { isPending: false, isError: false } as const;

function ready(view: HomeView) {
  if (view.kind !== 'ready') throw new Error(`expected ready, got ${view.kind}`);
  return view;
}
const card = (view: HomeView, id: string) => ready(view).cards.find((c) => c.game_id === id);

describe('deriveHomeView', () => {
  it('TS-5: carga', () => {
    expect(
      deriveHomeView({
        today: undefined,
        isPending: true,
        isError: false,
        sessionStatus: 'loading',
      }),
    ).toEqual({ kind: 'loading' });
  });

  it('TS-6: el error manda sobre datos viejos', () => {
    const view = deriveHomeView({
      today: todayFixture,
      isPending: false,
      isError: true,
      sessionStatus: 'active',
    });
    expect(view.kind).toBe('error');
    if (view.kind !== 'error') return;
    expect(view.cards.map((c) => c.game_id)).toEqual([...GAME_IDS]);
    for (const c of view.cards) {
      expect(c).toMatchObject({ status: null, streak: null, cta: null });
    }
  });

  it('TS-7: ningún desafío hoy', () => {
    const v = ready(
      deriveHomeView({ ...base, today: todayNoChallengesFixture, sessionStatus: 'active' }),
    );
    expect(v.variant).toBe('no_challenges');
    expect(v.progress).toEqual({ key: 'noChallenges', fill: 0 });
    expect(v.globalStreak).toBe(0);
    for (const c of v.cards) {
      expect(c).toMatchObject({
        status: 'none',
        streak: 0,
        cta: { kind: 'disabled', label: 'none' },
      });
    }
    expect(v.hero).toEqual({ label: 'browse', disabled: false });
    expect(v.summary).toBe('noChallenges');
  });

  it('TS-8: antes del lanzamiento', () => {
    const v = ready(
      deriveHomeView({ ...base, today: todayBeforeLaunchFixture, sessionStatus: 'active' }),
    );
    expect(v.variant).toBe('before_launch');
    expect(v.progress.key).toBe('beforeLaunch');
    for (const c of v.cards) {
      expect(c).toMatchObject({
        status: 'soon',
        streak: null,
        cta: { kind: 'disabled', label: 'soon' },
      });
    }
    expect(v.hero.label).toBe('browse');
    expect(v.summary).toBe('beforeLaunch');
  });

  it('TS-9: estado mixto con sesión', () => {
    const view = deriveHomeView({ ...base, today: todayFixture, sessionStatus: 'active' });
    const v = ready(view);
    expect(v.variant).toBe('normal');
    expect(v.progress).toEqual({
      key: 'completedWithChallenge',
      completed: 1,
      total: 4,
      fill: 0.25,
    });
    expect(card(view, 'devdle')).toMatchObject({
      status: 'completed',
      label: '✓ 4/6',
      streak: 5,
      cta: { kind: 'link', to: '/devdle', label: 'result', tone: 'secondary' },
    });
    expect(card(view, 'grep-grid')).toMatchObject({
      status: 'inProgress',
      streak: 2,
      cta: { kind: 'link', to: '/grep-grid', label: 'continue', tone: 'primary' },
    });
    expect(card(view, 'timeline')).toMatchObject({
      status: 'notPlayed',
      streak: 0,
      cta: { kind: 'link', to: '/timeline', label: 'play', tone: 'primary' },
    });
    expect(card(view, 'big-o')).toMatchObject({
      status: 'none',
      streak: 3,
      cta: { kind: 'disabled', label: 'none' },
    });
    expect(card(view, 'bug-hunt')).toMatchObject({ status: 'voided', streak: 1, cta: null });
    expect(v.hero.label).toBe('continue');
    expect(v.summary).toBe('streaks');
  });

  it('TS-10: progreso con los 5 publicados', () => {
    const v = ready(
      deriveHomeView({
        ...base,
        today: { ...todayFirstVisitFixture, completed_today: 1 },
        sessionStatus: 'active',
      }),
    );
    expect(v.progress).toEqual({ key: 'completed', completed: 1, total: 5, fill: 0.2 });
  });

  it('TS-11: primera visita', () => {
    const view = deriveHomeView({
      ...base,
      today: todayFirstVisitFixture,
      sessionStatus: 'active',
    });
    const v = ready(view);
    expect(v.hero).toEqual({ label: 'start', disabled: false });
    expect(v.summary).toBe('empty');
    for (const c of v.cards) {
      expect(c).toMatchObject({ status: 'notPlayed', cta: { kind: 'link', label: 'play' } });
    }
    expect(v.progress).toMatchObject({ key: 'completed', completed: 0, fill: 0 });
  });

  it('TS-12: cookies bloqueadas', () => {
    const v = ready(
      deriveHomeView({
        ...base,
        today: { ...todayFirstVisitFixture, has_session: false },
        sessionStatus: 'cookies_blocked',
      }),
    );
    expect(v.progress.key).toBe('noSession');
    expect(v.globalStreak).toBeNull();
    for (const c of v.cards) {
      expect(c).toMatchObject({
        status: 'noSession',
        streak: 0,
        cta: { kind: 'disabled', label: 'play' },
      });
    }
    expect(v.hero).toEqual({ label: 'start', disabled: true });
    expect(v.summary).toBe('noSession');
  });

  it('TS-13: sesión no disponible', () => {
    const v = ready(
      deriveHomeView({ ...base, today: todayFirstVisitFixture, sessionStatus: 'unavailable' }),
    );
    expect(v.progress.key).toBe('unavailable');
    expect(v.globalStreak).toBeNull();
    for (const c of v.cards) {
      expect(c).toMatchObject({
        status: null,
        streak: null,
        cta: { kind: 'disabled', label: 'play' },
      });
    }
    expect(v.hero).toEqual({ label: 'start', disabled: true });
    expect(v.summary).toBe('unavailable');
  });

  it('TS-14: sin desafío gana sobre cookies bloqueadas', () => {
    const v = ready(
      deriveHomeView({
        ...base,
        today: { ...todayNoChallengesFixture, has_session: false },
        sessionStatus: 'cookies_blocked',
      }),
    );
    expect(v.variant).toBe('no_challenges');
    for (const c of v.cards) {
      expect(c).toMatchObject({ status: 'none', cta: { kind: 'disabled', label: 'none' } });
    }
  });

  it('TS-15: sesión arrancando', () => {
    const view = deriveHomeView({ ...base, today: todayFixture, sessionStatus: 'loading' });
    expect(card(view, 'timeline')?.cta).toEqual({ kind: 'disabled', label: 'play' });
    expect(card(view, 'devdle')?.status).toBe('completed');
  });

  it('TS-16: juego ausente en la respuesta', () => {
    const view = deriveHomeView({
      ...base,
      today: { ...todayFixture, games: todayFixture.games.filter((g) => g.game_id !== 'timeline') },
      sessionStatus: 'active',
    });
    expect(ready(view).cards).toHaveLength(5);
    expect(card(view, 'timeline')).toMatchObject({ status: null, streak: null, cta: null });
  });

  it('TS-17: completado sin history_label', () => {
    const view = deriveHomeView({
      ...base,
      today: {
        ...todayFixture,
        games: todayFixture.games.map((g) =>
          g.game_id === 'devdle' ? { ...g, play_status: 'lost' as const, history_label: null } : g,
        ),
      },
      sessionStatus: 'active',
    });
    expect(card(view, 'devdle')).toMatchObject({
      status: 'completed',
      label: null,
      cta: { label: 'result' },
    });
  });

  describe('next, terminal y racha', () => {
    const active = { ...base, sessionStatus: 'active' } as const;

    it('TS-1: next = primer en curso', () => {
      const v = ready(deriveHomeView({ ...active, today: todayFixture }));
      expect(v.next).toBe('grep-grid');
      expect(v.cards.find((c) => c.game_id === 'grep-grid')?.next).toBe(true);
      expect(v.cards.filter((c) => c.next)).toHaveLength(1);
    });

    it('TS-2: next = primer publicado sin jugar', () => {
      expect(ready(deriveHomeView({ ...active, today: todayFirstVisitFixture })).next).toBe(
        'devdle',
      );
    });

    it('TS-3: next salta completados, none y anulados', () => {
      const games = [
        { ...todayFixture.games[0]!, play_status: 'won' as const },
        { ...todayFixture.games[1]!, challenge_status: 'none' as const, play_status: null },
        { ...todayFixture.games[2]!, challenge_status: 'voided' as const },
        { ...todayFixture.games[3]!, challenge_status: 'published' as const },
        { ...todayFixture.games[4]!, challenge_status: 'published' as const },
      ];
      expect(ready(deriveHomeView({ ...active, today: { ...todayFixture, games } })).next).toBe(
        'big-o',
      );
    });

    it('TS-4: sin next en estados sin destino', () => {
      const cases = [
        deriveHomeView({ ...base, today: todayNoChallengesFixture, sessionStatus: 'active' }),
        deriveHomeView({ ...base, today: todayBeforeLaunchFixture, sessionStatus: 'active' }),
        deriveHomeView({
          ...base,
          today: todayFirstVisitFixture,
          sessionStatus: 'cookies_blocked',
        }),
        deriveHomeView({ ...base, today: todayFirstVisitFixture, sessionStatus: 'unavailable' }),
        deriveHomeView({ ...base, today: todayFirstVisitFixture, sessionStatus: 'loading' }),
      ];
      for (const view of cases) {
        const v = ready(view);
        expect(v.next).toBeNull();
        expect(v.cards.every((c) => !c.next)).toBe(true);
      }
    });

    it('TS-5: filas de terminal en estado mixto', () => {
      const v = ready(deriveHomeView({ ...active, today: todayFixture }));
      expect(v.terminal.rows).toEqual([
        { game_id: 'devdle', state: 'done', metric: '4/6', status: 'done' },
        { game_id: 'grep-grid', state: 'in-progress', metric: '—', status: 'inProgress' },
        { game_id: 'timeline', state: 'pending', metric: '—', status: 'notPlayed' },
        { game_id: 'big-o', state: 'no-challenge', metric: '—', status: 'none' },
        { game_id: 'bug-hunt', state: 'voided', metric: '—', status: 'voided' },
      ]);
    });

    it('TS-6: filas sin desafíos, antes del lanzamiento, cookies y no disponible', () => {
      const rows = (
        today: Parameters<typeof deriveHomeView>[0]['today'],
        s: 'active' | 'cookies_blocked' | 'unavailable',
      ) => ready(deriveHomeView({ ...base, today, sessionStatus: s })).terminal.rows;
      expect(rows(todayNoChallengesFixture, 'active')).toSatisfy((r: ReturnType<typeof rows>) =>
        r.every((x) => x.state === 'no-challenge' && x.status === 'none'),
      );
      expect(rows(todayBeforeLaunchFixture, 'active')).toSatisfy((r: ReturnType<typeof rows>) =>
        r.every((x) => x.state === 'upcoming' && x.status === 'soon'),
      );
      expect(rows(todayFirstVisitFixture, 'cookies_blocked')).toSatisfy(
        (r: ReturnType<typeof rows>) =>
          r.every((x) => x.state === 'unavailable' && x.status === 'noSession'),
      );
      expect(rows(todayFirstVisitFixture, 'unavailable')).toSatisfy((r: ReturnType<typeof rows>) =>
        r.every((x) => x.state === 'unavailable' && x.metric === '—' && x.status === null),
      );
    });

    it('TS-7: métrica sin glifo y sin history_label', () => {
      const games = [
        { ...todayFixture.games[0]!, play_status: 'won' as const, history_label: '✓ 4/6' },
        { ...todayFixture.games[1]!, play_status: 'lost' as const, history_label: '✗ X/6' },
        { ...todayFixture.games[2]!, play_status: 'won' as const, history_label: null },
        todayFixture.games[3]!,
        todayFixture.games[4]!,
      ];
      const v = ready(deriveHomeView({ ...active, today: { ...todayFixture, games } }));
      expect(v.terminal.rows.slice(0, 3).map((r) => r.metric)).toEqual(['4/6', 'X/6', '—']);
      expect(
        v.terminal.rows.slice(0, 3).every((r) => r.state === 'done' && r.status === 'done'),
      ).toBe(true);
      expect(v.cards.slice(0, 3).map((c) => c.label)).toEqual(['✓ 4/6', '✗ X/6', null]);
    });

    it('TS-8: línea de racha de la terminal', () => {
      expect(ready(deriveHomeView({ ...active, today: todayFixture })).terminal.streak).toEqual({
        current: 5,
        max: 12,
        tone: 'streak',
      });
      expect(
        ready(deriveHomeView({ ...active, today: todayNoChallengesFixture })).terminal.streak,
      ).toEqual({ current: 0, max: 0, tone: 'dim' });
      expect(
        ready(
          deriveHomeView({
            ...base,
            today: todayFirstVisitFixture,
            sessionStatus: 'cookies_blocked',
          }),
        ).terminal.streak,
      ).toEqual({ current: null, max: null, tone: 'dim' });
    });
  });
});
