import type { TermItem } from '@nerdose/content';
import { terms } from '@nerdose/db';
import type { Db, Tx } from '@nerdose/db';
import { sql } from 'drizzle-orm';

export type UpsertMode = 'approved' | 'to_rejected' | 'insert_rejected';

export type TermRow = {
  id: string;
  wikidataId: string;
  term: string;
  category: string;
  definition: unknown;
  summary: unknown;
  sitelinks: number;
  status: 'approved' | 'rejected';
  rejectionReason: string | null;
};

export class ContentBanksRepository {
  constructor(private readonly orm: Db | Tx) {}

  listTerms(): Promise<TermRow[]> {
    return this.orm
      .select({
        id: terms.id,
        wikidataId: terms.wikidataId,
        term: terms.term,
        category: terms.category,
        definition: terms.definition,
        summary: terms.summary,
        sitelinks: terms.sitelinks,
        status: terms.status,
        rejectionReason: terms.rejectionReason,
      })
      .from(terms);
  }

  async upsertTerm(item: TermItem, datasetVersion: string, mode: UpsertMode): Promise<void> {
    const status = { status: item.status, rejectionReason: item.rejection_reason };
    const set =
      mode === 'approved'
        ? {
            term: item.term,
            category: item.category,
            definition: item.definition,
            summary: item.summary,
            sitelinks: item.sitelinks,
            ...status,
            datasetVersion,
          }
        : { ...status, datasetVersion };

    await this.orm
      .insert(terms)
      .values({
        wikidataId: item.wikidata_id,
        term: item.term,
        category: item.category,
        definition: item.definition,
        summary: item.summary,
        sitelinks: item.sitelinks,
        ...status,
        datasetVersion,
      })
      .onConflictDoUpdate({
        target: terms.wikidataId,
        set,
        setWhere: sql`${terms.status} <> 'rejected'`,
      });
  }
}
