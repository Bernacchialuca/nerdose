import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { writeDataset } from '../scripts/import-banks/write';

import { F_OK, MANIFEST_OK, T_OK } from './helpers';

describe('writeDataset', () => {
  it('validates the facts before writing anything (TS-21)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nc-write-'));
    expect(() =>
      writeDataset(dir, {
        terms: [T_OK],
        timelineFacts: [{ ...F_OK, note: { es: '', en: '' } }],
        manifest: MANIFEST_OK,
      }),
    ).toThrow();
    expect(readdirSync(dir)).toEqual([]);
  });
});
