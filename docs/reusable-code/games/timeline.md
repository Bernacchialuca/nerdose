# Reusable Code - games / Timeline

Package `@nerdose/game-timeline` (`packages/games/timeline`). Entries: `./definition`, `./client` (stub until S-029), `./generator`.

## Shared

### Dates (distinguishability and chronological order)
- **Location:** packages/games/timeline/src/shared/dates.ts
- **Description:** Two facts are distinguishable if their years differ; within the same year only if both have `month`/`day` precision and the months differ, or both have `day` precision and the dates differ. An identical date never is. Used by the generator, `verify` and the client.
- **Signature:** `type DatedFact = { event_date; date_precision }`; `distinguishable(a, b): boolean`; `allDistinguishable(facts): boolean`; `indistinguishablePairs<T>(facts): [T, T][]`; `compareChronological(a, b): number` (by `event_date`, ties by `id`)
- **Usage:** `[...facts].sort(compareChronological)`; `distinguishable({ event_date: '2009-01-01', date_precision: 'year' }, { event_date: '2009-05-01', date_precision: 'month' })` is `false`.

### PROMPTS
- **Location:** packages/games/timeline/src/shared/prompts.ts
- **Description:** Fixed `{ es, en }` prompt per `TimelineCategory`.
- **Signature:** `PROMPTS: Record<TimelineCategory, { es: string; en: string }>`

### formatEventDate
- **Location:** packages/games/timeline/src/shared/format-date.ts
- **Description:** Formats an event date by precision (`year` -> year, `month` -> month and year, `day` -> full date) with `Intl.DateTimeFormat` in UTC; never invents month or day.
- **Signature:** `formatEventDate(event_date: string, date_precision: DatePrecision, locale: Locale): string`
- **Usage:** `formatEventDate('2014-06-01', 'month', 'es')` returns `junio de 2014`.

## Definition

### timeline / definition
- **Location:** packages/games/timeline/src/definition/index.ts
- **Description:** `GameDefinition` of Timeline. The state stays `{}` until the single move confirms the order (`{ order }`); `applyMove` revalidates the permutation and returns `feedback: null`. `score` counts positions equal to `correct_order`; `reduceStats` accumulates `by_category[c].{played, correct}`; `historyLabel` is `N/5`.
- **Signature:** `GameDefinition<TimelinePayload, TimelinePublicView, TimelineState, TimelineMove, TimelineFeedback, TimelineResult, TimelineStats>`
- **Usage:** `createGameRegistry([devdle, grepGrid, timeline])`

### Schemas, constants and types
- **Location:** packages/games/timeline/src/definition/schemas.ts
- **Description:** `payloadSchema`, `moveSchema`, `stateSchema`, `publicViewSchema`, `feedbackSchema` (null), `resultSchema`, `statsSchema`, `ITEMS_COUNT`, `OPAQUE_ID_PATTERN` and the inferred `Timeline*` types.
- **Usage:** `payloadSchema.parse(generator.generate(...))`; `moveSchema.safeParse(body.move)`

### Test fixtures
- **Location:** packages/games/timeline/src/definition/test-fixtures.ts
- **Description:** Test-only (not exported from the entry): `PAYLOAD`, `ID`, `OID`, `CORRECT`, `SWAP`, `REVERSED`, `ROTATED`, `NOW`, `CTX_ES`, `CTX_EN`, `S0`, `move`, `CHRONO_ITEMS`.

## Client

### Stub
- **Location:** packages/games/timeline/src/client/index.ts
- **Description:** `export {};` until S-029 implements Instructions, Game, Result, share and i18n.

## Generator

### generator / TimelineFact
- **Location:** packages/games/timeline/src/generator/index.ts
- **Description:** `GameGenerator<TimelinePayload, TimelineFact>`. `TimelineFact` is the bank item contract for `bankItems` of `timeline_facts` (S-028): `{ id, label, category, event_date, date_precision, note: { es, en }, last_used }`. `historySpec = { bank: 'timeline_facts', lastUsedField: 'last_used', recentDays: 90 }`.

### verifyPayload
- **Location:** packages/games/timeline/src/generator/verify.ts
- **Description:** Nine ordered checks (`items_count`, `facts_in_bank`, `same_category`, `texts_bilingual`, `distinguishable`, `correct_order_consistent`, `opaque_ids`, `shuffled`, `not_used_90`); `reason` is the first failed one; never throws.

### eligibleFacts / isReusable / REUSE_WINDOW_DAYS / sortById
- **Location:** packages/games/timeline/src/generator/eligibility.ts
- **Description:** 90-day window plus exclusion of facts in recent challenges; stable order by `id`.

### chooseCategory / chooseFacts
- **Location:** packages/games/timeline/src/generator/choose.ts
- **Description:** Category with >= 5 eligible facts (picked with the rng; falls back to the bank, then throws `RangeError`); greedy selection of 5 distinguishable facts, completing with non-eligible ones when short.

### shuffle / drawOpaqueIds / drawInitialOrder / OPAQUE_ID_ALPHABET / MAX_REDRAWS / sameOrder
- **Location:** packages/games/timeline/src/generator/opaque.ts
- **Description:** Fisher-Yates on a copy; 5 unique 6-char ids from the rng (redrawn if alphabetical order equals chronological); initial permutation never the identity (up to 10 redraws).

### addDays / isValidDate
- **Location:** packages/games/timeline/src/generator/days.ts
- **Description:** Clock-free `YYYY-MM-DD` arithmetic in UTC (copy of Grep Grid: game packages cannot import each other).

### Test fixtures
- **Location:** packages/games/timeline/src/generator/test-fixtures.ts
- **Description:** Test-only: `DATE`, `DATE_V`, `seed(n)` (SHA-256 digest), `mk`, `BID`, `BANK_FIXTURE`, `BANK`, `BANK_TIGHT`, `history`.
