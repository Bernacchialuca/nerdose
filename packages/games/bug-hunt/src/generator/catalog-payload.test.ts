import { describe, expect, it } from 'vitest';

import { payloadSchema } from '../definition';

import { bugTypesOf, TEMPLATES } from './catalog';
import { D } from './test-fixtures';
import { assertValidPayload, catalogPayload } from './test-utils';

describe('catalogPayload (TS-30)', () => {
  const pairs = TEMPLATES.flatMap((t) => bugTypesOf(t).map((b) => [t, b] as const));

  it('covers the 62 pairs of the catalog', () => {
    expect(pairs).toHaveLength(62);
  });

  it.each(pairs.map(([t, b]) => [t.id, b, t] as const))(
    '%s %s is valid and deterministic',
    (_id, b, t) => {
      const p = catalogPayload(t, b);
      payloadSchema.parse(p);
      assertValidPayload(p);
      expect(p.template).toBe(t.id);
      expect(p.bug_type).toBe(b);
      expect(p.date).toBe(D);
      expect(catalogPayload(t, b)).toEqual(p);
    },
  );
});
