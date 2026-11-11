import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type { DatasetManifest, TermItem, TimelineFactItem } from '../src';

export const T_OK: TermItem = {
  wikidata_id: 'Q28865',
  term: 'PYTHON',
  category: 'programming_languages',
  definition: { es: 'lenguaje de programación', en: 'general-purpose programming language' },
  summary: { es: 'Python es un lenguaje de alto nivel…', en: 'Python is a high-level…' },
  sitelinks: 120,
  status: 'approved',
  rejection_reason: null,
};

export const F_OK: TimelineFactItem = {
  wikidata_id: 'Q251',
  label: 'Java',
  category: 'programming_languages',
  event_date: '1995-05-23',
  date_precision: 'day',
  note: { es: 'Java es un lenguaje de programación…', en: 'Java is a high-level…' },
  sitelinks: 150,
  status: 'approved',
  rejection_reason: null,
};

export const MANIFEST_OK: DatasetManifest = {
  dataset_version: '2026.11.06',
  generated_at: '2026-11-06T22:10:00.000Z',
  min_sitelinks: 20,
  counts: {
    terms: {
      approved: 1,
      rejected: 0,
      by_category: {
        programming_languages: { approved: 1, rejected: 0 },
        git: { approved: 0, rejected: 0 },
        databases: { approved: 0, rejected: 0 },
        networking: { approved: 0, rejected: 0 },
        linux: { approved: 0, rejected: 0 },
        apis: { approved: 0, rejected: 0 },
        security: { approved: 0, rejected: 0 },
        software_engineering: { approved: 0, rejected: 0 },
      },
      by_reason: {
        invalid_chars: 0,
        invalid_length: 0,
        missing_translation: 0,
        missing_article: 0,
        low_sitelinks: 0,
        excluded: 0,
        duplicate: 0,
      },
    },
    timeline_facts: {
      approved: 0,
      rejected: 0,
      by_category: {
        programming_languages: { approved: 0, rejected: 0 },
        frameworks: { approved: 0, rejected: 0 },
        companies: { approved: 0, rejected: 0 },
        operating_systems: { approved: 0, rejected: 0 },
        hardware: { approved: 0, rejected: 0 },
        video_games: { approved: 0, rejected: 0 },
        databases: { approved: 0, rejected: 0 },
        software_tools: { approved: 0, rejected: 0 },
      },
      by_reason: {
        disputed_date: 0,
        imprecise_date: 0,
        missing_article: 0,
        low_sitelinks: 0,
        missing_note: 0,
        note_year_mismatch: 0,
        excluded: 0,
        duplicate: 0,
      },
    },
  },
  parameters: {
    min_sitelinks: 20,
    min_approved_terms: 500,
    term_length: { min: 4, max: 12 },
    languages: ['es', 'en'],
    classes: [{ wikidata_class: 'Q9143', category: 'programming_languages' }],
    timeline: {
      min_sitelinks: 10,
      min_approved_total: 450,
      min_categories: 3,
      categories_v1: ['programming_languages'],
      classes: [
        { wikidata_class: 'Q9143', category: 'programming_languages', date_property: 'P571' },
      ],
    },
  },
};

export function makeDir(files: Record<string, unknown>): string {
  const dir = mkdtempSync(join(tmpdir(), 'nerdose-content-'));
  for (const [name, value] of Object.entries(files)) {
    writeFileSync(join(dir, name), typeof value === 'string' ? value : JSON.stringify(value));
  }
  return dir;
}

export function readFixture(path: string): unknown {
  return JSON.parse(readFileSync(new URL(`./fixtures/${path}`, import.meta.url), 'utf8'));
}

export function summaryFixtureName(url: string): string {
  const match = /^https:\/\/(es|en)\.wikipedia\.org\/api\/rest_v1\/page\/summary\/(.+)$/.exec(url);
  const [, lang, encoded] = match as unknown as [string, string, string];
  return `${lang}-${decodeURIComponent(encoded).replace(/[^A-Za-z0-9_+-]/g, '')}.json`;
}

const json = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export type FakeFetch = typeof globalThis.fetch & { urls: string[]; headers: Headers[] };

export function fixtureFetch(
  sparql: Record<string, string>,
  timelineSparql: Record<string, string> = {},
): FakeFetch {
  const urls: string[] = [];
  const headers: Headers[] = [];
  const fake = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    urls.push(url);
    headers.push(new Headers(init?.headers));
    if (url.startsWith('https://query.wikidata.org/sparql')) {
      const query = decodeURIComponent(/query=([^&]+)/.exec(url)?.[1] ?? '');
      // Las consultas de hechos son las únicas que piden `wikibase:timeValue`.
      const fixtures = query.includes('wikibase:timeValue') ? timelineSparql : sparql;
      const cls = Object.keys(fixtures).find((id) => query.includes(`wd:${id} `));
      if (cls === undefined) return json({ results: { bindings: [] } });
      return json(readFixture(fixtures[cls] as string));
    }
    try {
      return json(readFixture(`wikipedia/${summaryFixtureName(url)}`));
    } catch {
      return json({ title: 'Not found' }, 404);
    }
  }) as FakeFetch;
  fake.urls = urls;
  fake.headers = headers;
  return fake;
}
