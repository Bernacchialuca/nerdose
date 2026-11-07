import { describe, expect, it } from 'vitest';

import { fetchSummary, parseSummary, summaryUrl } from '../scripts/import-banks/wikipedia';

import { readFixture } from './helpers';

describe('wikipedia', () => {
  it('parses summaries and builds the URL (TS-30)', () => {
    expect(parseSummary(readFixture('wikipedia/es-Python.json'))).toMatch(/^Python es un lenguaje/);
    expect(parseSummary(readFixture('wikipedia/en-Mercury.json'))).toBeNull();
    expect(parseSummary(readFixture('wikipedia/es-empty.json'))).toBeNull();
    expect(summaryUrl('es', 'Python (lenguaje de programación)')).toBe(
      'https://es.wikipedia.org/api/rest_v1/page/summary/Python_(lenguaje_de_programaci%C3%B3n)',
    );
  });

  it('maps a 404 to null', async () => {
    const client = { getJson: async () => ({ status: 404, body: null }) };
    expect(await fetchSummary(client, 'en', 'Nope')).toBeNull();
  });
});
