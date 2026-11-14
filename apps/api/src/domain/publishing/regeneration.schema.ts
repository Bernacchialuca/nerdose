import { z } from 'zod';

export const regenerateParamSchema = z.object({ challenge_id: z.uuid() });
