# Shared enums

## LOCALES / Locale
- **Location:** packages/core/src/enums.ts
- **Description:** Runtime list of locales and derived type; aligned with the PG enum `locale`.
- **Signature:** `LOCALES = ['es','en'] as const`; `type Locale = 'es' | 'en'`
- **Usage:** `if (!LOCALES.includes(lang)) ...`

## CODE_LANGUAGES / CodeLanguage
- **Location:** packages/core/src/enums.ts
- **Description:** Runtime list of code languages; aligned with the PG enum `code_language`.
- **Signature:** `CODE_LANGUAGES = ['js','go','java'] as const`; `type CodeLanguage = 'js' | 'go' | 'java'`
- **Usage:** `z.enum(CODE_LANGUAGES)`
