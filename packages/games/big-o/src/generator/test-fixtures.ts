import { createHash } from 'node:crypto';

import type { RecentChallenge } from '@nerdose/core';

import type { BigOPayload } from '../definition';

import { paramCombos } from './catalog/params';
import { RECIPES } from './catalog/recipes';
import type { Params, Recipe } from './catalog/types';
import { buildPayload } from './generate';

export const D = '2027-03-15';

export const seed = (n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`big-o-test-seed-${n}`).digest());

export const seedFrom = (prefix: string, n: number): Uint8Array =>
  new Uint8Array(createHash('sha256').update(`big-o-test-seed-${prefix}-${n}`).digest());

export function recipe(id: string): Recipe {
  const found = RECIPES.find((r) => r.id === id);
  if (!found) throw new Error(`unknown recipe ${id}`);
  return found;
}

export function recent(date: string, id: string, params?: Params): RecentChallenge<BigOPayload> {
  const r = recipe(id);
  const chosen = params ?? paramCombos(r)[0] ?? [];
  return { date, payload: buildPayload(r, chosen) };
}
