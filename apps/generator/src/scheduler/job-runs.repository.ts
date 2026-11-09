import { jobRuns } from '@nerdose/db';
import type { Db, Tx } from '@nerdose/db';
import { eq, sql } from 'drizzle-orm';

export type JobRunStatus = 'success' | 'failed';

export class JobRunsRepository {
  constructor(private readonly orm: Db | Tx) {}

  async start(job: string): Promise<string> {
    const [row] = await this.orm.insert(jobRuns).values({ job }).returning({ id: jobRuns.id });
    return row!.id;
  }

  async finish(id: string, status: JobRunStatus, summary: Record<string, unknown>): Promise<void> {
    await this.orm
      .update(jobRuns)
      .set({ status, summary, finishedAt: sql`now()` })
      .where(eq(jobRuns.id, id));
  }
}
