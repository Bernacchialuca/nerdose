import { describe, expect, it } from 'vitest';

import {
  evaluateTerms,
  highestMinSitelinks,
  mergeByWikidataId,
  parseExclusions,
  precheck,
  type Candidate,
} from '../scripts/import-banks/rules';

import { T_OK } from './helpers';

const C_OK: Candidate = {
  wikidata_id: 'Q28865',
  category: 'programming_languages',
  label_en: 'Python',
  label_es: 'Python',
  description_en: 'general-purpose programming language',
  description_es: 'lenguaje de programación',
  article_en: 'Python (programming language)',
  article_es: 'Python',
  sitelinks: 120,
  summary_en: 'Python is a high-level…',
  summary_es: 'Python es un lenguaje de alto nivel…',
};

const base = { minSitelinks: 20, exclusions: parseExclusions('') };
const one = (patch: Partial<Candidate>, options = base) =>
  evaluateTerms([{ ...C_OK, ...patch }], options)[0]!;

describe('evaluateTerms', () => {
  it('approves a valid candidate (TS-11)', () => {
    expect(evaluateTerms([C_OK], base)).toEqual([T_OK]);
  });

  it('rejects digits, symbols and spaces (TS-12)', () => {
    for (const [label, term] of [
      ['Python3', 'PYTHON3'],
      ['C++', 'C++'],
      ['Machine learning', 'MACHINE LEARNING'],
    ] as const) {
      const item = one({ label_en: label });
      expect(item.status).toBe('rejected');
      expect(item.rejection_reason).toBe('invalid_chars');
      expect(item.term).toBe(term);
    }
  });

  it('checks the length 4 to 12 (TS-13)', () => {
    const cases: [string, string, string | null][] = [
      ['Go', 'GO', 'invalid_length'],
      ['SQL', 'SQL', 'invalid_length'],
      ['Rust', 'RUST', null],
      ['Cryptography', 'CRYPTOGRAPHY', null],
      ['Cryptographic', 'CRYPTOGRAPHIC', 'invalid_length'],
    ];
    for (const [label, term, reason] of cases) {
      const item = one({ label_en: label });
      expect(item.term).toBe(term);
      expect(item.rejection_reason).toBe(reason);
      expect(item.status).toBe(reason === null ? 'approved' : 'rejected');
    }
  });

  it('rejects missing translations with empty texts (TS-14)', () => {
    const a = one({ description_es: null });
    expect(a.rejection_reason).toBe('missing_translation');
    expect(a.definition.es).toBe('');
    expect(one({ description_en: '' }).rejection_reason).toBe('missing_translation');
    const c = one({ label_en: null });
    expect(c.rejection_reason).toBe('missing_translation');
    expect(c.term).toBe('');
  });

  it('rejects missing articles (TS-15)', () => {
    expect(one({ article_es: null }).rejection_reason).toBe('missing_article');
    const item = one({ summary_en: null });
    expect(item.rejection_reason).toBe('missing_article');
    expect(item.summary.en).toBe('');
    expect(one({ summary_es: '  ' }).rejection_reason).toBe('missing_article');
  });

  it('compares sitelinks with >= (TS-16)', () => {
    expect(one({ sitelinks: 19 }).rejection_reason).toBe('low_sitelinks');
    expect(one({ sitelinks: 20 }).status).toBe('approved');
  });

  it('excludes by term and by id (TS-17)', () => {
    const exclusions = parseExclusions('# genéricos\n\nsoftware\nQ28865\n');
    const items = evaluateTerms([C_OK, { ...C_OK, wikidata_id: 'Q7397', label_en: 'Software' }], {
      minSitelinks: 20,
      exclusions,
    });
    expect(items.map((i) => i.rejection_reason)).toEqual(['excluded', 'excluded']);
  });

  it('keeps the duplicate with most sitelinks (TS-18)', () => {
    const swift = (id: string, sitelinks: number): Candidate => ({
      ...C_OK,
      wikidata_id: id,
      label_en: 'Swift',
      sitelinks,
    });
    const byId = (items: ReturnType<typeof evaluateTerms>) =>
      Object.fromEntries(items.map((i) => [i.wikidata_id, i.rejection_reason]));
    expect(byId(evaluateTerms([swift('Q189133', 80), swift('Q2005', 40)], base))).toEqual({
      Q189133: null,
      Q2005: 'duplicate',
    });
    expect(byId(evaluateTerms([swift('Q189133', 50), swift('Q2005', 50)], base))).toEqual({
      Q189133: 'duplicate',
      Q2005: null,
    });
  });

  it('reports a single reason by precedence (TS-19)', () => {
    const item = one({ label_en: 'C3', description_es: null, sitelinks: 1 });
    expect(item.rejection_reason).toBe('invalid_chars');
  });
});

describe('mergeByWikidataId / precheck / highestMinSitelinks', () => {
  it('merges the same id keeping the first class (TS-20)', () => {
    const merged = mergeByWikidataId([
      C_OK,
      { ...C_OK, category: 'software_engineering' as const },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.category).toBe('programming_languages');
    expect(evaluateTerms(merged, base)[0]?.rejection_reason).toBeNull();
  });

  it('avoids summary requests for cheap rejections (TS-21)', () => {
    expect(precheck({ ...C_OK, summary_en: undefined, summary_es: undefined }).needsSummary).toBe(
      true,
    );
    expect(precheck({ ...C_OK, label_en: 'C++' }).needsSummary).toBe(false);
  });

  it('calibrates the highest min_sitelinks (TS-22)', () => {
    const candidates = [50, 40, 40, 30, 10].map((sitelinks, i) => ({
      ...C_OK,
      wikidata_id: `Q${i + 1}`,
      label_en: `Term${'abcde'[i]}`.replace(/\d/g, ''),
      sitelinks,
    }));
    const exclusions = parseExclusions('');
    expect(highestMinSitelinks(candidates, { exclusions, minApproved: 3 })).toBe(40);
    expect(highestMinSitelinks(candidates, { exclusions, minApproved: 6 })).toBeNull();
  });
});
