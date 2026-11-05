import { AppError, today, type GameId } from '@nerdose/core';

import type { ChallengesReadRepository } from '@/domain/publishing/publishing.repository';
import type { CachedChallenge } from '@/domain/publishing/publishing.types';
import type { Clock } from '@/shared/clock';

export class TodayCache {
  private map = new Map<GameId, CachedChallenge>();

  constructor(
    private readonly repo: ChallengesReadRepository,
    private readonly clock: Clock,
  ) {}

  /** Si la consulta falla rechaza y conserva el contenido anterior. */
  async reload(): Promise<void> {
    const rows = await this.repo.findTodayVisible(today(this.clock.now()));
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
