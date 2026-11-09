import { z } from 'zod';

export const gameParamSchema = z.object({ game_id: z.string() });
export const challengeNumberBodySchema = z.object({
  challenge_number: z.number().int().min(1),
});
