import type { CodeLanguage, Locale } from '@nerdose/core';

import { api } from '@/lib/api-client';

export type Preferences = { locale: Locale; preferred_code_language: CodeLanguage };
export type SessionResponse = Preferences & { created: boolean };
export type PreferencesUpdate = { locale?: Locale; preferred_code_language?: CodeLanguage };

export const sessionKeys = { all: ['session'] as const };

export const createSession = () =>
  api<SessionResponse>('/api/session', { method: 'POST', json: {} });

export const updatePreferences = (body: PreferencesUpdate) =>
  api<Preferences>('/api/me/preferences', { method: 'PATCH', json: body });
