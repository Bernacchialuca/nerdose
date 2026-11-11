import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  REJECTION_REASONS,
  TIMELINE_CATEGORIES,
  TIMELINE_REJECTION_REASONS,
  loadDataset,
  serializeItems,
} from '../src';
import { TIMELINE_CLASSES } from '../scripts/import-banks/classes';
import { buildTimelineParameters } from '../scripts/import-banks/manifest';
import { normalizeTerm, parseExclusions, YEAR_MENTION } from '../scripts/import-banks/rules';

const dataFile = (name: string): URL => new URL(`../data/${name}`, import.meta.url);
const text = (name: string): string => readFileSync(dataFile(name), 'utf8');

describe('committed dataset', () => {
  const { terms, timelineFacts, manifest } = loadDataset();
  const approved = terms.filter((t) => t.status === 'approved');

  it('loads by default with a valid version (TS-3)', () => {
    expect(terms.length).toBeGreaterThan(0);
    expect(manifest.dataset_version).toMatch(/^\d{4}\.\d{2}\.\d{2}(-\d+)?$/);
  });

  it('has at least 500 approved terms with complete texts (TS-41)', () => {
    expect(approved.length).toBeGreaterThanOrEqual(500);
    for (const term of approved) {
      expect(term.term).toMatch(/^[A-Z]{4,12}$/);
      for (const value of [
        term.definition.es,
        term.definition.en,
        term.summary.es,
        term.summary.en,
      ]) {
        expect(value.trim().length, term.wikidata_id).toBeGreaterThan(0);
      }
    }
  });

  it('is written in the canonical format (TS-42)', () => {
    expect(text('terms.json')).toBe(serializeItems(terms));
    expect(text('timeline_facts.json')).toBe(serializeItems(timelineFacts));
    expect(text('manifest.json')).toBe(JSON.stringify(manifest, null, 2) + '\n');
  });

  it('has a manifest consistent with the terms (TS-43)', () => {
    const counts = manifest.counts.terms;
    expect(counts.approved).toBe(approved.length);
    expect(counts.rejected).toBe(terms.length - approved.length);
    for (const [category, value] of Object.entries(counts.by_category)) {
      const inCategory = terms.filter((t) => t.category === category);
      expect(value.approved, category).toBe(
        inCategory.filter((t) => t.status === 'approved').length,
      );
      expect(value.rejected, category).toBe(
        inCategory.filter((t) => t.status === 'rejected').length,
      );
    }
    for (const reason of REJECTION_REASONS) {
      expect(counts.by_reason[reason], reason).toBe(
        terms.filter((t) => t.rejection_reason === reason).length,
      );
    }
    expect(manifest.min_sitelinks).toBe(manifest.parameters.min_sitelinks);
    expect(manifest.parameters.min_approved_terms).toBe(500);
    for (const term of approved) {
      expect(term.sitelinks, term.wikidata_id).toBeGreaterThanOrEqual(manifest.min_sitelinks);
    }
  });

  it('calibrates min_sitelinks to the highest value keeping 500 approved (TS-44)', () => {
    const higher = approved.filter((t) => t.sitelinks > manifest.min_sitelinks);
    expect(higher.length).toBeLessThan(500);
  });

  it('ships the support files and respects the exclusion list (TS-45)', () => {
    expect(existsSync(dataFile('exclusions.txt'))).toBe(true);
    const license = readFileSync(new URL('../LICENSE-DATA.md', import.meta.url), 'utf8');
    expect(license).toContain('CC BY-SA 4.0');
    expect(license).toContain('CC0');
    expect(license).toContain('Wikipedia');
    expect(license).toContain('Wikidata');
    const exclusions = parseExclusions(text('exclusions.txt'));
    for (const term of approved) {
      expect(exclusions.terms.has(term.term), term.term).toBe(false);
      expect(exclusions.ids.has(term.wikidata_id), term.wikidata_id).toBe(false);
    }
    for (const fact of timelineFacts.filter((f) => f.status === 'approved')) {
      expect(exclusions.ids.has(fact.wikidata_id), fact.wikidata_id).toBe(false);
      expect(exclusions.timelineIds.has(fact.wikidata_id), fact.wikidata_id).toBe(false);
    }
  });

  it('ships a canonical timeline_facts.json (TS-23)', () => {
    expect(existsSync(dataFile('timeline_facts.json'))).toBe(true);
    expect(text('timeline_facts.json')).toBe(serializeItems(timelineFacts));
  });

  it('has a manifest consistent with the timeline facts (TS-24)', () => {
    const counts = manifest.counts.timeline_facts;
    const params = manifest.parameters.timeline;
    const facts = timelineFacts.filter((f) => f.status === 'approved');
    expect(counts.approved).toBe(facts.length);
    expect(counts.rejected).toBe(timelineFacts.length - facts.length);
    for (const category of TIMELINE_CATEGORIES) {
      const inCategory = timelineFacts.filter((f) => f.category === category);
      expect(counts.by_category[category].approved, category).toBe(
        inCategory.filter((f) => f.status === 'approved').length,
      );
      expect(counts.by_category[category].rejected, category).toBe(
        inCategory.filter((f) => f.status === 'rejected').length,
      );
    }
    for (const reason of TIMELINE_REJECTION_REASONS) {
      expect(counts.by_reason[reason], reason).toBe(
        timelineFacts.filter((f) => f.rejection_reason === reason).length,
      );
    }
    expect(params.min_approved_total).toBe(450);
    expect(params.min_categories).toBe(3);
    for (const fact of facts) {
      expect(params.categories_v1, fact.wikidata_id).toContain(fact.category);
      expect(fact.sitelinks, fact.wikidata_id).toBeGreaterThanOrEqual(params.min_sitelinks);
    }
    expect(counts.approved).toBeGreaterThanOrEqual(params.min_approved_total);
  });

  it('keeps the terms bank untouched (TS-25, TS-46)', () => {
    expect(manifest.dataset_version).toMatch(/^2026\.\d{2}\.\d{2}(-\d+)?$/);
    expect(manifest.dataset_version).not.toBe('2026.11.10');
    expect(manifest.counts.terms.approved).toBe(515);
    expect(manifest.counts.terms.rejected).toBe(4348);
    expect(manifest.min_sitelinks).toBe(12);
  });

  it('covers at least three v1 categories and the total minimum of approved facts (TS-43)', () => {
    const params = manifest.parameters.timeline;
    expect(params.categories_v1.length).toBeGreaterThanOrEqual(3);
    expect(manifest.counts.timeline_facts.approved).toBeGreaterThanOrEqual(450);
    expect(params.classes).toEqual(
      buildTimelineParameters(TIMELINE_CLASSES, {
        minSitelinks: params.min_sitelinks,
        minApprovedTotal: params.min_approved_total,
        minCategories: params.min_categories,
      }).classes,
    );
    expect(params.categories_v1).toEqual(
      TIMELINE_CATEGORIES.filter((c) => TIMELINE_CLASSES.some((cls) => cls.category === c)),
    );
  });

  it('has no facts in the deferred categories (TS-44)', () => {
    const { categories_v1: v1 } = manifest.parameters.timeline;
    for (const category of TIMELINE_CATEGORIES.filter((c) => !v1.includes(c))) {
      expect(manifest.counts.timeline_facts.by_category[category], category).toEqual({
        approved: 0,
        rejected: 0,
      });
      expect(TIMELINE_CLASSES.some((cls) => cls.category === category)).toBe(false);
    }
  });

  it('has well-formed approved facts (TS-45)', () => {
    const facts = timelineFacts.filter((f) => f.status === 'approved');
    const generatedYear = new Date(manifest.generated_at).getUTCFullYear();
    const labels = new Set<string>();
    for (const fact of facts) {
      const year = Number(fact.event_date.slice(0, 4));
      expect(year, fact.wikidata_id).toBeGreaterThanOrEqual(1800);
      expect(year, fact.wikidata_id).toBeLessThanOrEqual(generatedYear);
      expect(fact.label.trim().length, fact.wikidata_id).toBeGreaterThan(0);
      for (const note of [fact.note.es, fact.note.en]) {
        expect(note.length, fact.wikidata_id).toBeLessThanOrEqual(240);
        for (const match of note.matchAll(YEAR_MENTION)) {
          expect(Number(match[1]), `${fact.wikidata_id}: ${note}`).toBe(year);
        }
      }
      const label = normalizeTerm(fact.label);
      expect(labels.has(label), label).toBe(false);
      labels.add(label);
    }
  });
});
