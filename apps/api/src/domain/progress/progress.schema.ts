import { z } from 'zod';

export const myStatsQuerySchema = z.object({ history_before: z.iso.date().optional() });
export type MyStatsQuery = z.infer<typeof myStatsQuerySchema>;
