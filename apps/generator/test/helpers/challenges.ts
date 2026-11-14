import { challengeNumber } from '@nerdose/core';
import type { Db } from '@nerdose/db';
import { makeChallenge } from '@nerdose/db/testing';

export const devdlePayload = (date: string, category = 'git') => ({
  term_id: '00000000-0000-4000-8000-000000000000',
  word: 'OTHER',
  category,
  definition: { es: 'a', en: 'b' },
  summary: { es: 'a', en: 'b' },
  date,
});

/** Siembra un challenge de Devdle con payload válido (recentChallenges parsea cada payload). */
export const seedDevdle = (
  owner: Db,
  date: string,
  status: 'draft' | 'approved' | 'published' | 'voided' | 'rejected',
  launchDate = '2026-11-20',
) =>
  makeChallenge(owner, {
    gameId: 'devdle',
    date,
    status,
    number: challengeNumber(date, launchDate)!,
    payload: devdlePayload(date),
    ...(status === 'voided' ? { voidReason: 'test', voidedAt: new Date() } : {}),
  });
