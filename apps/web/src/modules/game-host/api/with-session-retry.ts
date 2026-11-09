import { ApiError } from '@/lib/api-client';
import { createSession } from '@/modules/session';

/** Ante `no_session` recrea la sesión una vez y reintenta; cualquier otro error se propaga (D10). */
export async function withSessionRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ApiError && error.code === 'no_session') {
      await createSession();
      return fn();
    }
    throw error;
  }
}
