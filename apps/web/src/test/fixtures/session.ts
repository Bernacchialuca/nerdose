import type { SessionResponse } from '@/modules/session/api/session';

export const sessionFixture = {
  locale: 'es',
  preferred_code_language: 'js',
  created: false,
} satisfies SessionResponse;
