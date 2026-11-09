import { loadDataset as defaultLoadDataset, type Dataset, type TermItem } from '@nerdose/content';
import type { Db } from '@nerdose/db';
import type { Logger } from 'pino';

import { ContentBanksRepository, type TermRow } from './content-banks.repository';

const TERM_FORMAT = /^[A-Z]{4,12}$/;

export type SyncBanksSummary = {
  dataset_version: string;
  inserted: number;
  updated: number;
  unchanged: number;
  kept_rejected: number;
  skipped: number;
};

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

export async function syncBanks(deps: SyncBanksDeps): Promise<SyncBanksSummary> {
  const { db, log, loadDataset = defaultLoadDataset } = deps;
  const dataset = loadDataset();
  const version = dataset.manifest.dataset_version;
  const summary: SyncBanksSummary = {
    dataset_version: version,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    kept_rejected: 0,
    skipped: 0,
  };

  // Primero los approved: un rejected nuevo nunca ocupa el term que necesita un approved.
  const ordered = [
    ...dataset.terms.filter((item) => item.status === 'approved'),
    ...dataset.terms.filter((item) => item.status === 'rejected'),
  ];

  await db.transaction(async (tx) => {
    const repo = new ContentBanksRepository(tx);
    const existing = await repo.listTerms();
    const byWikidataId = new Map(existing.map((row) => [row.wikidataId, row]));
    const termOwner = new Map(existing.map((row) => [row.term, row.wikidataId]));

    const skip = (item: TermItem) => {
      summary.skipped++;
      log.warn({ wikidata_id: item.wikidata_id, term: item.term }, 'Term conflict, item skipped');
    };

    for (const item of ordered) {
      const row = byWikidataId.get(item.wikidata_id);
      const owner = termOwner.get(item.term);
      const taken = owner !== undefined && owner !== item.wikidata_id;

      if (row?.status === 'rejected') {
        summary.kept_rejected++;
      } else if (row && item.status === 'rejected') {
        await repo.upsertTerm(item, version, 'to_rejected');
        summary.updated++;
        log.info(
          { wikidata_id: item.wikidata_id, reason: item.rejection_reason },
          'ContentItemRejected',
        );
      } else if (row) {
        if (sameContent(row, item)) {
          summary.unchanged++;
        } else if (taken) {
          skip(item);
        } else {
          await repo.upsertTerm(item, version, 'approved');
          termOwner.delete(row.term);
          termOwner.set(item.term, item.wikidata_id);
          summary.updated++;
        }
      } else if (item.status === 'approved') {
        if (taken) {
          skip(item);
        } else {
          await repo.upsertTerm(item, version, 'approved');
          termOwner.set(item.term, item.wikidata_id);
          summary.inserted++;
        }
      } else if (!TERM_FORMAT.test(item.term) || owner !== undefined) {
        summary.skipped++;
      } else {
        await repo.upsertTerm(item, version, 'insert_rejected');
        termOwner.set(item.term, item.wikidata_id);
        summary.inserted++;
      }
    }
  });

  return summary;
}
