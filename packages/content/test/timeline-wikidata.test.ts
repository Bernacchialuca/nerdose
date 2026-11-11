import { describe, expect, it } from 'vitest';

import {
  buildTimelineClassQuery,
  parseTimelineResults,
  TIMELINE_QUERY_LIMIT,
} from '../scripts/import-banks/wikidata';

const uri = (value: string) => ({ type: 'uri', value });
const lit = (value: string) => ({ type: 'literal', value });
const RANK = 'http://wikiba.se/ontology#';

describe('buildTimelineClassQuery', () => {
  it('asks for every date statement with precision, rank and uncertainty (TS-4)', () => {
    const query = buildTimelineClassQuery({
      wikidataClass: 'Q9143',
      category: 'programming_languages',
      dateProperty: 'P571',
    });
    for (const fragment of [
      'wdt:P31/wdt:P279* wd:Q9143 ',
      'p:P571',
      'psv:P571',
      'wikibase:timeValue',
      'wikibase:timePrecision',
      'wikibase:rank',
      'pq:P1319',
      'pq:P1326',
      'pq:P1480',
      'FILTER(?sitelinks >= 5)',
      `LIMIT ${TIMELINE_QUERY_LIMIT}`,
      'rdfs:label',
      'schema:description',
      '<https://es.wikipedia.org/>',
    ]) {
      expect(query).toContain(fragment);
    }
    expect(query).not.toContain('p:P577');
  });

  it('adds the fallback property and a class-specific floor (TS-4)', () => {
    const query = buildTimelineClassQuery({
      wikidataClass: 'Q7889',
      category: 'video_games',
      dateProperty: 'P577',
      fallbackProperty: 'P571',
      queryFloor: 40,
    });
    expect(query).toContain('("P577" p:P577 psv:P577)');
    expect(query).toContain('("P571" p:P571 psv:P571)');
    expect(query).toContain('?date_prop');
    expect(query).toContain('FILTER(?sitelinks >= 40)');
  });
});

describe('parseTimelineResults', () => {
  const base = {
    label_en: lit('Thing'),
    sitelinks: lit('42'),
    article_en: lit('Thing'),
    description_es: lit('una cosa'),
    date_prop: lit('P571'),
  };
  const fixture = {
    results: {
      bindings: [
        {
          ...base,
          item: uri('http://www.wikidata.org/entity/Q22661306'),
          time: lit('2014-06-01T00:00:00Z'),
          precision: lit('10'),
          rank: uri(`${RANK}NormalRank`),
        },
        {
          ...base,
          item: uri('http://www.wikidata.org/entity/Q251'),
          time: lit('1995-05-23T00:00:00Z'),
          precision: lit('11'),
          rank: uri(`${RANK}PreferredRank`),
        },
        {
          ...base,
          item: uri('http://www.wikidata.org/entity/Q251'),
          time: lit('1994-01-01T00:00:00Z'),
          precision: lit('9'),
          rank: uri(`${RANK}NormalRank`),
          earliest: lit('1993-01-01T00:00:00Z'),
        },
        {
          ...base,
          item: uri('http://www.wikidata.org/entity/Q251'),
          time: lit('1994-01-01T00:00:00Z'),
          precision: lit('9'),
          rank: uri(`${RANK}NormalRank`),
        },
        {
          ...base,
          item: uri('http://example.org/not-an-item'),
          time: lit('2000-01-01T00:00:00Z'),
          precision: lit('9'),
          rank: uri(`${RANK}NormalRank`),
        },
      ],
    },
  };

  it('groups rows by item and maps rank, precision and uncertainty (TS-5)', () => {
    const candidates = parseTimelineResults(fixture, 'frameworks');
    expect(candidates.map((c) => c.wikidata_id)).toEqual(['Q22661306', 'Q251']);
    expect(candidates[0]).toMatchObject({
      label_en: 'Thing',
      description_es: 'una cosa',
      article_en: 'Thing',
      sitelinks: 42,
      category: 'frameworks',
      dates: [
        {
          property: 'P571',
          time: '2014-06-01T00:00:00Z',
          precision: 10,
          rank: 'normal',
          uncertain: false,
        },
      ],
    });
    expect(candidates[1]?.dates).toHaveLength(2);
    expect(candidates[1]?.dates[0]?.rank).toBe('preferred');
    expect(candidates[1]?.dates[1]).toMatchObject({ rank: 'normal', uncertain: true });
  });

  it('marks circa statements as uncertain', () => {
    const [candidate] = parseTimelineResults(
      {
        results: {
          bindings: [
            {
              ...base,
              item: uri('http://www.wikidata.org/entity/Q5'),
              time: lit('1980-01-01T00:00:00Z'),
              precision: lit('9'),
              rank: uri(`${RANK}NormalRank`),
              sourcing: uri('http://www.wikidata.org/entity/Q5727902'),
            },
          ],
        },
      },
      'companies',
    );
    expect(candidate?.dates[0]?.uncertain).toBe(true);
  });
});
