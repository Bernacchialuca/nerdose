import { z } from 'zod';

export const voidParamSchema = z.object({ challenge_id: z.uuid() });

const culpritSchema = z
  .object({
    kind: z.enum(['term', 'timeline_fact', 'template', 'none']),
    id: z.uuid().optional(),
  })
  .strict()
  .superRefine((culprit, ctx) => {
    const needsId = culprit.kind === 'term' || culprit.kind === 'timeline_fact';
    if (needsId && culprit.id === undefined) {
      ctx.addIssue({ code: 'custom', path: ['id'], message: 'id requerido' });
    }
    if (!needsId && culprit.id !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['id'], message: 'id no permitido' });
    }
  });

export const voidRequestSchema = z
  .object({
    void_reason: z.string().trim().min(1).max(500),
    culprit: culpritSchema,
  })
  .strict();

export type VoidRequest = z.infer<typeof voidRequestSchema>;
