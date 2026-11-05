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
});
