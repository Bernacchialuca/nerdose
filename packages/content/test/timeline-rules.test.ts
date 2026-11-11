import { describe, expect, it } from 'vitest';

import { timelineFactItemSchema, timelineFactsFileSchema } from '../src';
import {
  evaluateFacts,
  firstSentence,
  highestMinSitelinksTimeline,
  mergeByWikidataId,
  parseExclusions,
  precheckFact,
} from '../scripts/import-banks/rules';
import type { DateStatement, FactCandidate } from '../scripts/import-banks/wikidata';

const st = (
  time: string,
  precision: number,
  rank: DateStatement['rank'] = 'normal',
  extra: Partial<DateStatement> = {},
): DateStatement => ({ property: 'P571', time, precision, rank, uncertain: false, ...extra });

const KUBERNETES: FactCandidate = {
  wikidata_id: 'Q22661306',
  category: 'frameworks',
  label_en: 'Kubernetes',
  description_en: 'container orchestration system',
  description_es: 'sistema de orquestación de contenedores',
  article_en: 'Kubernetes',
  article_es: 'Kubernetes',
  sitelinks: 60,
  dates: [st('2014-06-01T00:00:00Z', 10)],
  summary_en:
    'Kubernetes is an open-source container orchestration system for automating software deployment, scaling, and management. Originally designed by Google, the project is now maintained by the CNCF.',
  summary_es:
    'Kubernetes es una plataforma de código abierto para automatizar la implementación, el escalado y la administración de aplicaciones en contenedores. Fue diseñada originalmente por Google.',
};
const OPTS = { minSitelinks: 20, exclusions: parseExclusions(''), currentYear: 2026 };
const evaluate = (c: FactCandidate, options = OPTS) => evaluateFacts([c], options)[0]!;

describe('firstSentence', () => {
  it('takes the first sentence and caps it at 240 characters (TS-17)', () => {
    expect(
      firstSentence(
        'Kubernetes is an open-source container orchestration system. Originally designed by Google.',
      ),
    ).toBe('Kubernetes is an open-source container orchestration system.');
    expect(firstSentence('Go is a language')).toBe('Go is a language');
    const long = firstSentence(Array(30).fill('abcdefghij').join(' ') + '.');
    expect(long.length).toBeLessThanOrEqual(240);
    expect(long.endsWith('…')).toBe(true);
    expect(long.slice(0, -1).endsWith('abcdefghij')).toBe(true);
  });

  it('does not cut at abbreviations', () => {
    expect(firstSentence('Acme Corp. is a company founded in Spain. It makes tools.')).toBe(
      'Acme Corp. is a company founded in Spain.',
    );
  });
});

describe('evaluateFacts', () => {
  it('approves a complete fact (TS-18)', () => {
    const fact = evaluate(KUBERNETES);
    expect(fact).toEqual({
      wikidata_id: 'Q22661306',
      label: 'Kubernetes',
      category: 'frameworks',
      event_date: '2014-06-01',
      date_precision: 'month',
      note: {
        es: 'Kubernetes es una plataforma de código abierto para automatizar la implementación, el escalado y la administración de aplicaciones en contenedores.',
        en: 'Kubernetes is an open-source container orchestration system for automating software deployment, scaling, and management.',
      },
      sitelinks: 60,
      status: 'approved',
      rejection_reason: null,
    });
    expect(() => timelineFactItemSchema.parse(fact)).not.toThrow();
  });

  it('uses the short description when the note mentions another year (TS-19)', () => {
    const fact = evaluate({
      ...KUBERNETES,
      summary_en: 'Kubernetes was announced by Google in 2015 as an open-source project.',
    });
    expect(fact.status).toBe('approved');
    expect(fact.note.en).toBe('container orchestration system');
    expect(fact.note.es).toContain('plataforma de código abierto');
  });

  it('keeps a note that mentions the same year (TS-20)', () => {
    const fact = evaluate({
      ...KUBERNETES,
      summary_en: 'Kubernetes is a system first released in 2014.',
    });
    expect(fact).toMatchObject({
      status: 'approved',
      note: { en: 'Kubernetes is a system first released in 2014.' },
    });
  });

  it('rejects when the description is missing or also contradicts (TS-21)', () => {
    expect(
      evaluate({
        ...KUBERNETES,
        summary_es: 'Kubernetes fue lanzado en 2015.',
        description_es: null,
      }),
    ).toMatchObject({ status: 'rejected', rejection_reason: 'missing_note' });
    expect(
      evaluate({
        ...KUBERNETES,
        summary_en: 'Released in 2015.',
        description_en: 'system released in 2016',
      }),
    ).toMatchObject({ status: 'rejected', rejection_reason: 'note_year_mismatch' });
    expect(
      evaluate({
        ...KUBERNETES,
        summary_es: 'Lanzado en 2015.',
        description_es: null,
        summary_en: 'Released in 2015.',
        description_en: 'system from 2016',
      }),
    ).toMatchObject({ status: 'rejected', rejection_reason: 'missing_note' });
  });

  it('applies the rules in order (TS-22)', () => {
    const disputed = [st('1991-01-01T00:00:00Z', 9), st('1994-01-01T00:00:00Z', 9)];
    const reason = (c: FactCandidate, exclusions = OPTS.exclusions) =>
      evaluate(c, { ...OPTS, exclusions }).rejection_reason;
    expect(reason({ ...KUBERNETES, dates: disputed, sitelinks: 3 })).toBe('disputed_date');
    expect(
      reason({ ...KUBERNETES, dates: [st('1990-01-01T00:00:00Z', 8)], article_es: null }),
    ).toBe('imprecise_date');
    expect(reason({ ...KUBERNETES, article_es: null, sitelinks: 3 })).toBe('missing_article');
    expect(reason({ ...KUBERNETES, summary_es: null })).toBe('missing_article');
    expect(reason({ ...KUBERNETES, sitelinks: 19 }, parseExclusions('Q22661306'))).toBe(
      'low_sitelinks',
    );
    expect(reason(KUBERNETES, parseExclusions('Q22661306'))).toBe('excluded');
    expect(reason(KUBERNETES, parseExclusions('KUBERNETES'))).toBe('excluded');
  });

  it('keeps the most sitelinked of two equal labels (TS-23)', () => {
    const a = { ...KUBERNETES, wikidata_id: 'Q100', label_en: 'Mercury', sitelinks: 50 };
    const b = { ...KUBERNETES, wikidata_id: 'Q200', label_en: 'MERCURY', sitelinks: 30 };
    const [first, second] = evaluateFacts([a, b], OPTS);
    expect(first).toMatchObject({ status: 'approved' });
    expect(second).toMatchObject({ status: 'rejected', rejection_reason: 'duplicate' });

    const c = { ...KUBERNETES, wikidata_id: 'Q300', sitelinks: 40 };
    const d = { ...KUBERNETES, wikidata_id: 'Q90', sitelinks: 40 };
    const [third, fourth] = evaluateFacts([c, d], OPTS);
    expect(third).toMatchObject({ rejection_reason: 'duplicate' });
    expect(fourth).toMatchObject({ status: 'approved' });
  });

  it('merges the same id across classes keeping the first (TS-24)', () => {
    const merged = mergeByWikidataId([KUBERNETES, { ...KUBERNETES, category: 'companies' }]);
    expect(merged).toHaveLength(1);
    expect(merged[0]?.category).toBe('frameworks');
  });

  it('shapes rejected items so the file stays valid (TS-25)', () => {
    const items = evaluateFacts(
      [
        {
          ...KUBERNETES,
          wikidata_id: 'Q1',
          dates: [st('1991-01-01T00:00:00Z', 9), st('1994-01-01T00:00:00Z', 9)],
        },
        {
          ...KUBERNETES,
          wikidata_id: 'Q2',
          label_en: 'Other',
          dates: [st('1990-01-01T00:00:00Z', 9, 'deprecated')],
        },
      ],
      OPTS,
    );
    expect(items[0]).toMatchObject({
      event_date: '1991-01-01',
      date_precision: 'year',
      note: { es: '', en: '' },
      status: 'rejected',
    });
    expect(items[1]).toMatchObject({
      event_date: '0000-01-01',
      date_precision: 'year',
      rejection_reason: 'imprecise_date',
    });
    expect(() => timelineFactsFileSchema.parse(items)).not.toThrow();
  });
});

describe('precheckFact', () => {
  it('asks for summaries only after the cheap rules (TS-26)', () => {
    const needs = (c: FactCandidate) => precheckFact(c, { currentYear: 2026 }).needsSummary;
    expect(
      needs({
        ...KUBERNETES,
        dates: [st('1991-01-01T00:00:00Z', 9), st('1994-01-01T00:00:00Z', 9)],
      }),
    ).toBe(false);
    expect(needs({ ...KUBERNETES, dates: [st('1990-01-01T00:00:00Z', 8)] })).toBe(false);
    expect(needs({ ...KUBERNETES, article_en: null })).toBe(false);
    expect(needs({ ...KUBERNETES, sitelinks: 3 })).toBe(true);
  });
});

describe('highestMinSitelinksTimeline', () => {
  const fact = (
    id: string,
    category: FactCandidate['category'],
    sitelinks: number,
    label: string,
  ) =>
    ({
      ...KUBERNETES,
      wikidata_id: id,
      category,
      sitelinks,
      label_en: label,
    }) satisfies FactCandidate;
  const base = {
    exclusions: parseExclusions(''),
    currentYear: 2026,
    minApprovedTotal: 4,
  };

  it('returns the sitelinks of the n-th approved fact across categories (TS-27)', () => {
    const candidates = [
      fact('Q1', 'programming_languages', 50, 'A1'),
      fact('Q2', 'programming_languages', 40, 'A2'),
      fact('Q3', 'programming_languages', 30, 'A3'),
      fact('Q4', 'frameworks', 60, 'B1'),
      fact('Q5', 'frameworks', 20, 'B2'),
      fact('Q6', 'frameworks', 10, 'B3'),
    ];
    // 60, 50, 40, 30, 20, 10: el cuarto es 30, sin importar la categoría.
    expect(highestMinSitelinksTimeline(candidates, base)).toBe(30);
    expect(highestMinSitelinksTimeline(candidates.slice(0, 3), base)).toBeNull();
  });
});
