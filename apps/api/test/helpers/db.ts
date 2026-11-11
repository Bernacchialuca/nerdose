import { randomUUID } from 'node:crypto';

import {
  challengeReports,
  challenges,
  plays,
  playerGameStats,
  playerStats,
  players,
  terms,
} from '@nerdose/db';
import { createDb } from '@nerdose/db';
import { truncateAll } from '@nerdose/db/testing';
import { inject } from 'vitest';

import { IdentityRepository } from '@/domain/identity/identity.repository';
import { IdentityService } from '@/domain/identity/identity.service';

export const PAYLOAD = {
  term_id: '0b9f1c3e-5a2d-4c1b-9e7f-2a6d8c4b1e01',
  word: 'MERGE',
  category: 'git',
  definition: {
    es: 'Combinar los cambios de dos ramas en una.',
    en: 'Combine the changes of two branches into one.',
  },
  summary: {
    es: 'Operación de Git que integra historias.',
    en: 'Git operation that integrates histories.',
  },
  date: '2026-12-01',
};

export const CATS = [
  'programming_languages',
  'git',
  'databases',
  'networking',
  'linux',
  'apis',
  'security',
  'software_engineering',
];

export function useDatabases() {
  const owner = createDb(inject('ownerUrl'), { max: 2 });
  const api = createDb(inject('apiUrl'), { max: 4 });
  let termSeq = 0;
  return {
    owner,
    api,
    identity: () => new IdentityService(new IdentityRepository(api.db)),
    reset: () => truncateAll(owner),
    close: async () => {
      await Promise.all([owner.sql.end({ timeout: 0 }), api.sql.end({ timeout: 0 })]);
    },
    insertPlayer: async (values: Partial<typeof players.$inferInsert> = {}) => {
      const [row] = await owner.db
        .insert(players)
        .values({ id: randomUUID(), ...values })
        .returning();
      return row!;
    },
    insertChallenge: async (
      values: Pick<typeof challenges.$inferInsert, 'gameId' | 'date'> &
        Partial<typeof challenges.$inferInsert>,
    ) => {
      const [row] = await owner.db
        .insert(challenges)
        .values({
          status: 'published',
          number: 1,
          payload: {},
          generatorVersion: 'test',
          seed: 'test',
          attempt: 0,
          ...values,
        })
        .returning();
      return row!;
    },
    insertPlay: async (
      values: Pick<
        typeof plays.$inferInsert,
        'playerId' | 'challengeId' | 'gameId' | 'date' | 'state'
      > &
        Partial<typeof plays.$inferInsert>,
    ) => {
      const [row] = await owner.db.insert(plays).values(values).returning();
      return row!;
    },
    insertGameStats: async (values: typeof playerGameStats.$inferInsert) => {
      const [row] = await owner.db.insert(playerGameStats).values(values).returning();
      return row!;
    },
    insertPlayerStats: async (values: typeof playerStats.$inferInsert) => {
      const [row] = await owner.db.insert(playerStats).values(values).returning();
      return row!;
    },
    insertReport: async (
      values: Pick<typeof challengeReports.$inferInsert, 'challengeId' | 'playerId'> &
        Partial<typeof challengeReports.$inferInsert>,
    ) => {
      const [row] = await owner.db
        .insert(challengeReports)
        .values({
          reason: 'wrong_answer',
          locale: 'es',
          context: { code_language: null, play_status: null, play_state: null, user_agent: null },
          ...values,
        })
        .returning();
      return row!;
    },
    insertTerm: async (values: Partial<typeof terms.$inferInsert> & { term: string }) => {
      termSeq += 1;
      const [row] = await owner.db
        .insert(terms)
        .values({
          category: 'git',
          definition: { es: 'd', en: 'd' },
          summary: { es: 's', en: 's' },
          wikidataId: `Q${randomUUID()}-${termSeq}`,
          sitelinks: 10,
          status: 'approved',
          datasetVersion: 'test',
          ...values,
        })
        .returning();
      return row!;
    },
  };
}

export function parseSetCookie(header: string | null) {
  if (!header) return null;
  const [pair = '', ...attrs] = header.split(';').map((p) => p.trim());
  const [name, value] = pair.split('=');
  return {
    name,
    value,
    attrs: attrs.map((a) => a.toLowerCase()).sort(),
  };
}

export const COOKIE_ATTRS = ['httponly', 'max-age=34560000', 'path=/', 'samesite=lax', 'secure'];
