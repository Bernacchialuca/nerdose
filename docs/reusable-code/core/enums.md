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

## TERM_CATEGORIES / TermCategory
- **Location:** packages/core/src/enums.ts
- **Description:** Fixed-order list of the 8 term categories; aligned with PG enum `term_category` and `DevdlePublicView.possible_categories`.
- **Signature:** `TERM_CATEGORIES = ['programming_languages','git','databases','networking','linux','apis','security','software_engineering'] as const`; `type TermCategory = (typeof TERM_CATEGORIES)[number]`
- **Usage:** `public_view: { length: 5, possible_categories: [...TERM_CATEGORIES] }`

## TIMELINE_CATEGORIES / TimelineCategory
- **Location:** packages/core/src/enums.ts
- **Description:** Fixed-order list of the 6 timeline fact categories; aligned with PG enum `timeline_category` and `TimelineCategory` in `api.yaml`. `@nerdose/content` re-exports it; the `timeline` game package imports it from `core`.
- **Signature:** `TIMELINE_CATEGORIES = ['programming_languages','frameworks','companies','operating_systems','hardware','video_games'] as const`; `type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number]`
- **Usage:** `category: z.enum(TIMELINE_CATEGORIES)`

## DATE_PRECISIONS / DatePrecision
- **Location:** packages/core/src/enums.ts
- **Description:** Fixed-order list of date precisions of a timeline fact; aligned with PG enum `date_precision` and `DatePrecision` in `api.yaml`. `@nerdose/content` re-exports it; the `timeline` game package imports it from `core`.
- **Signature:** `DATE_PRECISIONS = ['year','month','day'] as const`; `type DatePrecision = (typeof DATE_PRECISIONS)[number]`
- **Usage:** `pgEnum('date_precision', DATE_PRECISIONS)`
