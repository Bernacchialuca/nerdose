import { AppError, type GameId } from '@nerdose/core';

import type { ChallengesReadRepository } from '@/domain/publishing/publishing.repository';
import type { CachedChallenge } from '@/domain/publishing/publishing.types';

export class TodayCache {
  private map = new Map<GameId, CachedChallenge>();

  constructor(private readonly repo: ChallengesReadRepository) {}

  /** Si la consulta falla rechaza y conserva el contenido anterior. */
  async reload(day: string): Promise<void> {
    const rows = await this.repo.findTodayVisible(day);
    this.map = new Map(rows.map((c) => [c.game_id, c]));
  }

  get(gameId: GameId): CachedChallenge {
    const c = this.map.get(gameId);
    if (!c) throw new AppError('no_challenge_today');
    return c;
  }

  find(gameId: GameId): CachedChallenge | undefined {
    return this.map.get(gameId);
  }
}
