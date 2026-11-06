import { GAME_IDS } from '@nerdose/core';
import type { TerminalRowState } from '@nerdose/ui';

import type { SessionStatus } from '@/modules/session';

import type { GameId, Today, TodayGame } from './api/today';

export type CardStatus =
  | 'notPlayed'
  | 'inProgress'
  | 'completed'
  | 'none'
  | 'voided'
  | 'soon'
  | 'noSession'
  | null;

export type CtaLabel = 'play' | 'continue' | 'result' | 'none' | 'soon';

export type CardCta =
  | {
      kind: 'link';
      to: string;
      label: 'play' | 'continue' | 'result';
      tone: 'primary' | 'secondary';
    }
  | { kind: 'disabled'; label: CtaLabel };

export type CardView = {
  game_id: GameId;
  status: CardStatus;
  label: string | null;
  streak: number | null;
  cta: CardCta | null;
  next: boolean;
};

export type TerminalStatusKey =
  | 'done'
  | 'notPlayed'
  | 'inProgress'
  | 'none'
  | 'voided'
  | 'soon'
  | 'noSession';

export type TerminalRowView = {
  game_id: GameId;
  state: TerminalRowState;
  metric: string;
  status: TerminalStatusKey | null;
};

export type ProgressKey =
  | 'completed'
  | 'completedWithChallenge'
  | 'noChallenges'
  | 'beforeLaunch'
  | 'noSession'
  | 'unavailable';

export type HomeProgress = { key: ProgressKey; fill: number; completed?: number; total?: number };
export type HeroLabel = 'continue' | 'start' | 'browse';
export type SummaryKey =
  | 'beforeLaunch'
  | 'noChallenges'
  | 'noSession'
  | 'unavailable'
  | 'empty'
  | 'streaks';

export type HomeView =
  | { kind: 'loading' }
  | { kind: 'error'; cards: CardView[] }
  | {
      kind: 'ready';
      date: string;
      next: GameId | null;
      terminal: {
        rows: TerminalRowView[];
        streak: { current: number | null; max: number | null; tone: 'streak' | 'dim' };
      };
      variant: 'before_launch' | 'no_challenges' | 'normal';
      number: number | null;
      secondsToReset: number;
      progress: HomeProgress;
      globalStreak: number | null;
      streaks: { current: number; max: number };
      cards: CardView[];
      hero: { label: HeroLabel; disabled: boolean };
      summary: SummaryKey;
    };

type Input = {
  today: Today | undefined;
  isPending: boolean;
  isError: boolean;
  sessionStatus: SessionStatus;
};

const EMPTY_CARD = { status: null, label: null, streak: null, cta: null, next: false } as const;

function cardView(
  gameId: GameId,
  game: TodayGame | undefined,
  variant: 'before_launch' | 'no_challenges' | 'normal',
  sessionStatus: SessionStatus,
): CardView {
  const base = { game_id: gameId, next: false };
  if (!game) return { ...base, ...EMPTY_CARD };
  if (variant === 'before_launch') {
    return {
      ...base,
      status: 'soon',
      label: null,
      streak: null,
      cta: { kind: 'disabled', label: 'soon' },
    };
  }
  if (game.challenge_status === 'none') {
    return {
      ...base,
      status: 'none',
      label: null,
      streak: game.current_streak,
      cta: { kind: 'disabled', label: 'none' },
    };
  }
  if (sessionStatus === 'unavailable') {
    return {
      ...base,
      status: null,
      label: null,
      streak: null,
      cta: { kind: 'disabled', label: 'play' },
    };
  }
  if (sessionStatus === 'cookies_blocked') {
    return {
      ...base,
      status: 'noSession',
      label: null,
      streak: game.current_streak,
      cta: { kind: 'disabled', label: 'play' },
    };
  }
  if (game.challenge_status === 'voided' || game.play_status === 'voided') {
    return { ...base, status: 'voided', label: null, streak: game.current_streak, cta: null };
  }

  const to = `/${gameId}`;
  const streak = game.current_streak;
  const active = sessionStatus === 'active';
  const make = (
    status: CardStatus,
    label: string | null,
    ctaLabel: 'play' | 'continue' | 'result',
    tone: 'primary' | 'secondary',
  ): CardView => ({
    ...base,
    status,
    label,
    streak,
    cta: active
      ? { kind: 'link', to, label: ctaLabel, tone }
      : { kind: 'disabled', label: ctaLabel },
  });

  if (game.play_status === 'in_progress') return make('inProgress', null, 'continue', 'primary');
  if (game.play_status === 'won' || game.play_status === 'lost') {
    return make('completed', game.history_label, 'result', 'secondary');
  }
  return make('notPlayed', null, 'play', 'primary');
}

const ROW_BY_STATUS: Record<
  NonNullable<CardStatus>,
  { state: TerminalRowState; status: TerminalStatusKey }
> = {
  completed: { state: 'done', status: 'done' },
  notPlayed: { state: 'pending', status: 'notPlayed' },
  inProgress: { state: 'in-progress', status: 'inProgress' },
  none: { state: 'no-challenge', status: 'none' },
  voided: { state: 'voided', status: 'voided' },
  soon: { state: 'upcoming', status: 'soon' },
  noSession: { state: 'unavailable', status: 'noSession' },
};

function terminalRow(card: CardView): TerminalRowView {
  if (card.status === null) {
    return { game_id: card.game_id, state: 'unavailable', metric: '—', status: null };
  }
  const { state, status } = ROW_BY_STATUS[card.status];
  const metric =
    card.status === 'completed' && card.label ? card.label.replace(/^[✓✗]\s*/, '') : '—';
  return { game_id: card.game_id, state, metric, status };
}

function pickNext(today: Today): GameId | null {
  const candidates = GAME_IDS.map((id) => today.games.find((g) => g.game_id === id)).filter(
    (g): g is TodayGame => g !== undefined && g.challenge_status === 'published',
  );
  const found =
    candidates.find((g) => g.play_status === 'in_progress') ??
    candidates.find((g) => g.play_status === null);
  return found?.game_id ?? null;
}

export function deriveHomeView({ today, isPending, isError, sessionStatus }: Input): HomeView {
  if (isError) {
    return {
      kind: 'error',
      cards: GAME_IDS.map((game_id) => ({ game_id, ...EMPTY_CARD })),
    };
  }
  if (isPending || today === undefined) return { kind: 'loading' };

  const variant =
    today.number === null
      ? 'before_launch'
      : today.games.every((g) => g.challenge_status === 'none')
        ? 'no_challenges'
        : 'normal';
  const blocked = sessionStatus === 'cookies_blocked';
  const unavailable = sessionStatus === 'unavailable';

  let progress: HomeProgress;
  if (variant === 'before_launch') progress = { key: 'beforeLaunch', fill: 0 };
  else if (variant === 'no_challenges') progress = { key: 'noChallenges', fill: 0 };
  else if (blocked) progress = { key: 'noSession', fill: 0 };
  else if (unavailable) progress = { key: 'unavailable', fill: 0 };
  else {
    const total = today.games.filter((g) => g.challenge_status !== 'none').length;
    const completed = today.completed_today;
    progress = {
      key: total === GAME_IDS.length ? 'completed' : 'completedWithChallenge',
      completed,
      total,
      fill: total ? Math.min(1, Math.max(0, completed / total)) : 0,
    };
  }

  const firstVisit =
    today.global_streak.max === 0 &&
    today.completed_today === 0 &&
    !today.games.some((g) => g.play_status === 'in_progress');

  let hero: { label: HeroLabel; disabled: boolean };
  if (variant !== 'normal') hero = { label: 'browse', disabled: false };
  else if (blocked || unavailable) hero = { label: 'start', disabled: true };
  else if (firstVisit) hero = { label: 'start', disabled: false };
  else hero = { label: 'continue', disabled: false };

  let summary: SummaryKey;
  if (variant === 'before_launch') summary = 'beforeLaunch';
  else if (variant === 'no_challenges') summary = 'noChallenges';
  else if (blocked) summary = 'noSession';
  else if (unavailable) summary = 'unavailable';
  else if (firstVisit) summary = 'empty';
  else summary = 'streaks';

  const next = variant === 'normal' && sessionStatus === 'active' ? pickNext(today) : null;
  const cards = GAME_IDS.map((id) => ({
    ...cardView(
      id,
      today.games.find((g) => g.game_id === id),
      variant,
      sessionStatus,
    ),
    next: id === next,
  }));
  const unknownStreak = blocked || unavailable;

  return {
    kind: 'ready',
    date: today.date,
    next,
    terminal: {
      rows: cards.map(terminalRow),
      streak: {
        current: unknownStreak ? null : today.global_streak.current,
        max: unknownStreak ? null : today.global_streak.max,
        tone: !unknownStreak && today.global_streak.current > 0 ? 'streak' : 'dim',
      },
    },
    variant,
    number: today.number,
    secondsToReset: today.seconds_to_reset,
    progress,
    globalStreak: blocked || unavailable ? null : today.global_streak.current,
    streaks: today.global_streak,
    cards,
    hero,
    summary,
  };
}
