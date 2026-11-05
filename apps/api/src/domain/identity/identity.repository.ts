import type { CodeLanguage, Locale } from '@nerdose/core';
import { players } from '@nerdose/db';
import type { Db, Player, Tx } from '@nerdose/db';
import { eq, sql } from 'drizzle-orm';

export class IdentityRepository {
  constructor(private readonly db: Db | Tx) {}

  async findById(id: string): Promise<Player | null> {
    const [row] = await this.db.select().from(players).where(eq(players.id, id));
    return row ?? null;
  }

  async create(input: { locale: Locale; preferredCodeLanguage: CodeLanguage }): Promise<Player> {
    const [row] = await this.db
      .insert(players)
      .values({ locale: input.locale, preferredCodeLanguage: input.preferredCodeLanguage })
      .returning();
    return row!;
  }

  async touch(id: string): Promise<Player | null> {
    const [row] = await this.db
      .update(players)
      .set({ lastSeenAt: sql`now()` })
      .where(eq(players.id, id))
      .returning();
    return row ?? null;
  }

  async updatePreferences(
    id: string,
    patch: { locale?: Locale; preferredCodeLanguage?: CodeLanguage },
  ): Promise<Player | null> {
    const set: { locale?: Locale; preferredCodeLanguage?: CodeLanguage } = {};
    if (patch.locale !== undefined) set.locale = patch.locale;
    if (patch.preferredCodeLanguage !== undefined) {
      set.preferredCodeLanguage = patch.preferredCodeLanguage;
    }
    if (Object.keys(set).length === 0) return this.findById(id);
    const [row] = await this.db.update(players).set(set).where(eq(players.id, id)).returning();
    return row ?? null;
  }
}
