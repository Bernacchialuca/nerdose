import type { CachedChallenge } from './publishing.types';

export interface ChallengesReadRepository {
  findTodayVisible(day: string): Promise<CachedChallenge[]>;
}

/** Fuente vacía hasta que FG-3 conecte la tabla `challenges`. */
export class EmptyChallengesRepository implements ChallengesReadRepository {
  async findTodayVisible(): Promise<CachedChallenge[]> {
    return [];
  }
}
