import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { REJECTION_REASONS, loadDataset, serializeItems } from '../src';
import { parseExclusions } from '../scripts/import-banks/rules';

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
  });

  it('has no timeline_facts until FG-5 (TS-46)', () => {
    expect(existsSync(dataFile('timeline_facts.json'))).toBe(false);
    expect(timelineFacts).toEqual([]);
  });
});
