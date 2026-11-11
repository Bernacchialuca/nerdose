import {
  loadDataset as defaultLoadDataset,
  type Dataset,
  type TermItem,
  type TimelineFactItem,
} from '@nerdose/content';
import type { Db } from '@nerdose/db';
import type { Logger } from 'pino';

import {
  ContentBanksRepository,
  type TermRow,
  type TimelineFactRow,
} from './content-banks.repository';

const TERM_FORMAT = /^[A-Z]{4,12}$/;

export type BankCounts = {
  inserted: number;
  updated: number;
  unchanged: number;
  kept_rejected: number;
  skipped: number;
};

export type SyncBanksSummary = BankCounts & {
  dataset_version: string;
  by_bank: { terms: BankCounts; timeline_facts: BankCounts };
};

const emptyCounts = (): BankCounts => ({
  inserted: 0,
  updated: 0,
  unchanged: 0,
  kept_rejected: 0,
  skipped: 0,
});

const sumCounts = (a: BankCounts, b: BankCounts): BankCounts => ({
  inserted: a.inserted + b.inserted,
  updated: a.updated + b.updated,
  unchanged: a.unchanged + b.unchanged,
  kept_rejected: a.kept_rejected + b.kept_rejected,
  skipped: a.skipped + b.skipped,
});

export type SyncBanksDeps = {
  db: Db;
  log: Logger;
  loadDataset?: () => Dataset;
};

const sameContent = (row: TermRow, item: TermItem): boolean => {
  const definition = row.definition as { es: string; en: string };
  const summary = row.summary as { es: string; en: string };
  return (
    row.term === item.term &&
    row.category === item.category &&
    row.sitelinks === item.sitelinks &&
    definition.es === item.definition.es &&
    definition.en === item.definition.en &&
    summary.es === item.summary.es &&
    summary.en === item.summary.en
  );
};

export const sameFactContent = (row: TimelineFactRow, item: TimelineFactItem): boolean => {
  const note = row.note as { es: string; en: string };
  return (
    row.label === item.label &&
    row.category === item.category &&
    row.eventDate === item.event_date &&
    row.datePrecision === item.date_precision &&
    row.sitelinks === item.sitelinks &&
    note.es === item.note.es &&
    note.en === item.note.en
  );
};

/** True si el valor es `YYYY-MM-DD`, año >= 1 y fecha real de calendario (PostgreSQL la acepta). */
export const isStorableDate = (value: string): boolean => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  if (y < 1) return false;
  const date = new Date(Date.UTC(2000, 0, 1));
  date.setUTCFullYear(y, m - 1, d);
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

async function syncTerms(
  repo: ContentBanksRepository,
  items: TermItem[],
  version: string,
  counts: BankCounts,
  log: Logger,
): Promise<void> {
  // Primero los approved: un rejected nuevo nunca ocupa el term que necesita un approved.
  const ordered = [
    ...items.filter((item) => item.status === 'approved'),
    ...items.filter((item) => item.status === 'rejected'),
  ];

  const existing = await repo.listTerms();
  const byWikidataId = new Map(existing.map((row) => [row.wikidataId, row]));
  const termOwner = new Map(existing.map((row) => [row.term, row.wikidataId]));

  const skip = (item: TermItem) => {
    counts.skipped++;
    log.warn({ wikidata_id: item.wikidata_id, term: item.term }, 'Term conflict, item skipped');
  };

  for (const item of ordered) {
    const row = byWikidataId.get(item.wikidata_id);
    const owner = termOwner.get(item.term);
    const taken = owner !== undefined && owner !== item.wikidata_id;

    if (row?.status === 'rejected') {
      counts.kept_rejected++;
    } else if (row && item.status === 'rejected') {
      await repo.upsertTerm(item, version, 'to_rejected');
      counts.updated++;
      log.info(
        { bank: 'terms', wikidata_id: item.wikidata_id, reason: item.rejection_reason },
        'ContentItemRejected',
      );
    } else if (row) {
      if (sameContent(row, item)) {
        counts.unchanged++;
      } else if (taken) {
        skip(item);
      } else {
        await repo.upsertTerm(item, version, 'approved');
        termOwner.delete(row.term);
        termOwner.set(item.term, item.wikidata_id);
        counts.updated++;
      }
    } else if (item.status === 'approved') {
      if (taken) {
        skip(item);
      } else {
        await repo.upsertTerm(item, version, 'approved');
        termOwner.set(item.term, item.wikidata_id);
        counts.inserted++;
      }
    } else if (!TERM_FORMAT.test(item.term) || owner !== undefined) {
      counts.skipped++;
    } else {
      await repo.upsertTerm(item, version, 'insert_rejected');
      termOwner.set(item.term, item.wikidata_id);
      counts.inserted++;
    }
  }
}

async function syncTimelineFacts(
  repo: ContentBanksRepository,
  items: TimelineFactItem[],
  version: string,
  counts: BankCounts,
  log: Logger,
): Promise<void> {
  const existing = await repo.listTimelineFacts();
  const byWikidataId = new Map(existing.map((row) => [row.wikidataId, row]));

  for (const item of items) {
    const row = byWikidataId.get(item.wikidata_id);

    if (row?.status === 'rejected') {
      counts.kept_rejected++;
    } else if (row && item.status === 'rejected') {
      // En to_rejected el VALUES es irrelevante: se usa la fecha guardada para que siempre sea válido.
      await repo.upsertTimelineFact({ ...item, event_date: row.eventDate }, version, 'to_rejected');
      counts.updated++;
      log.info(
        { bank: 'timeline_facts', wikidata_id: item.wikidata_id, reason: item.rejection_reason },
        'ContentItemRejected',
      );
    } else if (row) {
      if (sameFactContent(row, item)) {
        counts.unchanged++;
      } else {
        await repo.upsertTimelineFact(item, version, 'approved');
        counts.updated++;
      }
    } else if (item.status === 'approved') {
      await repo.upsertTimelineFact(item, version, 'approved');
      counts.inserted++;
    } else if (!isStorableDate(item.event_date)) {
      counts.skipped++;
    } else {
      await repo.upsertTimelineFact(item, version, 'insert_rejected');
      counts.inserted++;
    }
  }
}

export async function syncBanks(deps: SyncBanksDeps): Promise<SyncBanksSummary> {
  const { db, log, loadDataset = defaultLoadDataset } = deps;
  const dataset = loadDataset();
  const version = dataset.manifest.dataset_version;
  const byBank = { terms: emptyCounts(), timeline_facts: emptyCounts() };

  await db.transaction(async (tx) => {
    const repo = new ContentBanksRepository(tx);
    await syncTerms(repo, dataset.terms, version, byBank.terms, log);
    await syncTimelineFacts(repo, dataset.timelineFacts, version, byBank.timeline_facts, log);
  });

  return {
    dataset_version: version,
    ...sumCounts(byBank.terms, byBank.timeline_facts),
    by_bank: byBank,
  };
}
