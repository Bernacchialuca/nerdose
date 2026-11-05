# Session, locale and today query

## SessionProvider / useSession
- **Location:** apps/web/src/modules/session/session-provider.tsx, use-session.ts
- **Description:** Calls `POST /api/session` once per load, applies the returned `locale` with i18next, refetches `GET /api/today?lang=` after the session and derives `status`.
- **Signature:** `useSession(): { status: 'loading' | 'active' | 'cookies_blocked' | 'unavailable'; canPlay: boolean; locale: Locale; preferred_code_language: CodeLanguage | null; changeLocale(locale: Locale): Promise<void> }` (throws outside the provider)
- **Usage:** `const { canPlay } = useSession();`

## LanguageSelector
- **Location:** apps/web/src/modules/session/components/language-selector.tsx
- **Signature:** `LanguageSelector()` - no props; reads `useSession()`

## useToday / todayKeys / fetchToday
- **Location:** apps/web/src/modules/catalog/api/today.ts, use-today.ts
- **Signature:** `useToday()`; `fetchToday(lang: Locale): Promise<Today>`; `todayKeys.all`, `todayKeys.detail(lang)`
- **Usage:** `const { data } = useToday();`

## sessionKeys / createSession / updatePreferences
- **Location:** apps/web/src/modules/session/api/session.ts
- **Signature:** `createSession(): Promise<SessionResponse>`; `updatePreferences(body: PreferencesUpdate): Promise<Preferences>`
