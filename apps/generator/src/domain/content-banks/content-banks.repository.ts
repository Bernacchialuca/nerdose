import type { TermItem, TimelineFactItem } from '@nerdose/content';
import { terms, timelineFacts } from '@nerdose/db';
import type { Db, Tx, TimelineFact } from '@nerdose/db';
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

export type TimelineFactRow = Pick<
  TimelineFact,
  | 'id'
  | 'wikidataId'
  | 'label'
  | 'category'
  | 'eventDate'
  | 'datePrecision'
  | 'note'
  | 'sitelinks'
  | 'status'
  | 'rejectionReason'
>;

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

  listTimelineFacts(): Promise<TimelineFactRow[]> {
    return this.orm
      .select({
        id: timelineFacts.id,
        wikidataId: timelineFacts.wikidataId,
        label: timelineFacts.label,
        category: timelineFacts.category,
        eventDate: timelineFacts.eventDate,
        datePrecision: timelineFacts.datePrecision,
        note: timelineFacts.note,
        sitelinks: timelineFacts.sitelinks,
        status: timelineFacts.status,
        rejectionReason: timelineFacts.rejectionReason,
      })
      .from(timelineFacts);
  }

  async upsertTimelineFact(
    item: TimelineFactItem,
    datasetVersion: string,
    mode: UpsertMode,
  ): Promise<void> {
    const status = { status: item.status, rejectionReason: item.rejection_reason };
    const content = {
      label: item.label,
      category: item.category,
      eventDate: item.event_date,
      datePrecision: item.date_precision,
      note: item.note,
      sitelinks: item.sitelinks,
    };
    const set =
      mode === 'approved'
        ? { ...content, ...status, datasetVersion }
        : { ...status, datasetVersion };

    await this.orm
      .insert(timelineFacts)
      .values({ wikidataId: item.wikidata_id, ...content, ...status, datasetVersion })
      .onConflictDoUpdate({
        target: timelineFacts.wikidataId,
        set,
        setWhere: sql`${timelineFacts.status} <> 'rejected'`,
      });
  }
}
