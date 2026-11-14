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

## BIG_O_OPTIONS / BigOOption
- **Location:** packages/core/src/enums.ts
- **Description:** Fixed-order list of the 8 Big O options the player sees; aligned with `BigOOption` in `api.yaml`. Lives in `challenges.payload` (jsonb), no pgEnum.
- **Signature:** `BIG_O_OPTIONS = ['o_1','o_log_n','o_n','o_n_log_n','o_n2','o_n3','o_2n','o_n_fact'] as const`; `type BigOOption = (typeof BIG_O_OPTIONS)[number]`
- **Usage:** `option: z.enum(BIG_O_OPTIONS)`; `toPublic: () => ({ options: BIG_O_OPTIONS })`

## RECIPE_CATEGORIES / RecipeCategory
- **Location:** packages/core/src/enums.ts
- **Description:** Initial, extensible set of 5 recipe categories (new ones are appended, never reordered); aligned with `RecipeCategory` in `api.yaml`. No pgEnum.
- **Signature:** `RECIPE_CATEGORIES = ['simple_loops','nested_loops','recursion','divide_and_conquer','binary_search'] as const`; `type RecipeCategory = (typeof RECIPE_CATEGORIES)[number]`
- **Usage:** `category: z.enum(RECIPE_CATEGORIES)`

## TERM_CATEGORIES / TermCategory
- **Location:** packages/core/src/enums.ts
- **Description:** Fixed-order list of the 8 term categories; aligned with PG enum `term_category` and `DevdlePublicView.possible_categories`.
- **Signature:** `TERM_CATEGORIES = ['programming_languages','git','databases','networking','linux','apis','security','software_engineering'] as const`; `type TermCategory = (typeof TERM_CATEGORIES)[number]`
- **Usage:** `public_view: { length: 5, possible_categories: [...TERM_CATEGORIES] }`

## TIMELINE_CATEGORIES / TimelineCategory
- **Location:** packages/core/src/enums.ts
- **Description:** Fixed-order list of the 8 timeline fact categories (`databases` and `software_tools` appended in migration 0005); aligned with PG enum `timeline_category` and `TimelineCategory` in `api.yaml`. `@nerdose/content` re-exports it; the `timeline` game package imports it from `core`.
- **Signature:** `TIMELINE_CATEGORIES = ['programming_languages','frameworks','companies','operating_systems','hardware','video_games','databases','software_tools'] as const`; `type TimelineCategory = (typeof TIMELINE_CATEGORIES)[number]`
- **Usage:** `category: z.enum(TIMELINE_CATEGORIES)`

## DATE_PRECISIONS / DatePrecision
- **Location:** packages/core/src/enums.ts
- **Description:** Fixed-order list of date precisions of a timeline fact; aligned with PG enum `date_precision` and `DatePrecision` in `api.yaml`. `@nerdose/content` re-exports it; the `timeline` game package imports it from `core`.
- **Signature:** `DATE_PRECISIONS = ['year','month','day'] as const`; `type DatePrecision = (typeof DATE_PRECISIONS)[number]`
- **Usage:** `pgEnum('date_precision', DATE_PRECISIONS)`

## REPORT_REASONS / ReportReason
- **Location:** packages/core/src/enums.ts
- **Description:** Report reasons; aligned with the PG enum `report_reason`.
- **Signature:** `REPORT_REASONS = ['wrong_answer','ambiguous','wrong_explanation','translation','display_bug','other'] as const`
- **Usage:** `z.enum(REPORT_REASONS)`

## REPORT_STATUSES / ReportStatus
- **Location:** packages/core/src/enums.ts
- **Description:** Report statuses; aligned with the PG enum `report_status`.
- **Signature:** `REPORT_STATUSES = ['open','resolved','dismissed'] as const`
- **Usage:** `pgEnum('report_status', REPORT_STATUSES)`

## GENERATION_REQUEST_STATUSES / GenerationRequestStatus
- **Location:** packages/core/src/enums.ts
- **Description:** Regeneration request statuses; aligned with the PG enum `generation_request_status`.
- **Signature:** `GENERATION_REQUEST_STATUSES = ['pending','done','failed','cancelled'] as const`
- **Usage:** `pgEnum('generation_request_status', GENERATION_REQUEST_STATUSES)`
