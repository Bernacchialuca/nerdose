import { AppError } from '@nerdose/core';
import type { Hook } from '@hono/zod-validator';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const validationHook: Hook<any, any, any> = (result) => {
  if (!result.success) throw new AppError('validation_error');
};
