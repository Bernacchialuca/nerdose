import { createContext } from 'react';

import type { CodeLanguage, Locale } from '@nerdose/core';

export type SessionStatus = 'loading' | 'active' | 'cookies_blocked' | 'unavailable';

export type SessionContextValue = {
  status: SessionStatus;
  canPlay: boolean;
  locale: Locale;
  preferred_code_language: CodeLanguage | null;
  changeLocale: (locale: Locale) => Promise<void>;
  /** Refleja en la cache de sesión el lenguaje con el que la `api` cerró una partida (sin `PATCH`). */
  rememberCodeLanguage: (language: CodeLanguage) => void;
};

export const SessionContext = createContext<SessionContextValue | null>(null);
