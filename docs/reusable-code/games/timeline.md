# Reusable Code - games / Timeline

Package `@nerdose/game-timeline` (`packages/games/timeline`). Entries: `./definition`, `./client`, `./generator`.

## Shared

### Dates (distinguishability and chronological order)
- **Location:** packages/games/timeline/src/shared/dates.ts
- **Description:** Two facts are distinguishable if their years differ; within the same year only if both have `month`/`day` precision and the months differ, or both have `day` precision and the dates differ. An identical date never is. Used by the generator, `verify` and the client.
- **Signature:** `type DatedFact = { event_date; date_precision }`; `distinguishable(a, b): boolean`; `allDistinguishable(facts): boolean`; `indistinguishablePairs<T>(facts): [T, T][]`; `compareChronological(a, b): number` (by `event_date`, ties by `id`)
- **Usage:** `[...facts].sort(compareChronological)`; `distinguishable({ event_date: '2009-01-01', date_precision: 'year' }, { event_date: '2009-05-01', date_precision: 'month' })` is `false`.

### PROMPT
- **Location:** packages/games/timeline/src/shared/prompts.ts
- **Description:** Single fixed `{ es, en }` prompt for every day (the challenge mixes categories).
- **Signature:** `PROMPT: { es: 'Ordená estos hitos del más antiguo al más reciente'; en: 'Order these milestones from oldest to newest' }`

### formatEventDate
- **Location:** packages/games/timeline/src/shared/format-date.ts
- **Description:** Formats an event date by precision (`year` -> year, `month` -> month and year, `day` -> full date) with `Intl.DateTimeFormat` in UTC; never invents month or day.
- **Signature:** `formatEventDate(event_date: string, date_precision: DatePrecision, locale: Locale): string`
- **Usage:** `formatEventDate('2014-06-01', 'month', 'es')` returns `junio de 2014`.

## Definition

### timeline / definition
- **Location:** packages/games/timeline/src/definition/index.ts
- **Description:** `GameDefinition` of Timeline. The state stays `{}` until the single move confirms the order (`{ order }`); `applyMove` revalidates the permutation and returns `feedback: null`. `score` counts positions equal to `correct_order`; `reduceStats` accumulates per milestone: each of the 5 items adds `played` to its fact's category and `correct` when it ended in its position (`by_category[c].{played, correct}`); `toPublic` exposes `{ prompt, items: [{ opaque_id, label, category }] }`; `historyLabel` is `N/5`. `culprits(p)` returns the 5 `items` as `timeline_fact` culprits (`fact_id`, `label`; never `opaque_id`) in `items` order; admin-only, matches `generator.usedBankItems` (checked in `src/generator/culprits.test.ts`). Declares `bankUsage` (`timeline_facts`, `last_used`, 90 days, `ITEMS_COUNT` items per challenge); `src/generator/bank-usage.test.ts` ties it to `historySpec`, `REUSE_WINDOW_DAYS` and `usedBankItems`. Implements `codeLanguage: () => null` (no code in this game; the `plays.code_language` CHECK only allows big-o and bug-hunt); tests in `src/definition/definition.test.ts` (initial and closed state, registry, type, purity).
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

Entry `./client` (React 19, dnd-kit). Same props contract as Devdle and Grep Grid; never imports `../definition/index` (only the schemas).

### Instructions
- **Location:** packages/games/timeline/src/client/instructions.tsx
- **Description:** Instructions screen: `h1` in the game accent, meta, three `Card` `step`s, count notice and a "Start" button that calls `onStart` once per attempt (re-armed when `starting` returns to `false`). Slots `notices` and `actions`; the rules section has `id={HELP_TARGET_ID}`.
- **Signature:** `Instructions(props: InstructionsProps)`

### Game
- **Location:** packages/games/timeline/src/client/game.tsx
- **Description:** Playing screen: prompt `h1`, "// tu orden" panel with five sortable rows (dnd-kit: handle-only drag with mouse/touch, keyboard sensor, up/down buttons), silent hint line plus polite live region, help text (`#game-help`) and "Confirm order" (`moveSchema.parse` then `onMove`, once per submit). Local order survives a language change (same id set) and restarts when the id set changes; `pending`/`locked` block rows; `moveError` is handled by identity.
- **Signature:** `Game(props: GameProps)`

### CategoryTag
- **Location:** packages/games/timeline/src/client/category-tag.tsx
- **Description:** `// <category>` label of one milestone (translated, `data-category`), used in the playing rows and in the result rail; it never reveals the date.
- **Signature:** `CategoryTag({ category, t })`

### Result
- **Location:** packages/games/timeline/src/client/result.tsx
- **Description:** Result screen: fixed comment, verdict `h1` (5/5 perfect, N of 5, none), score, "your order" with check/cross per position and "correct order" rail with dates by precision, the category tag of each milestone and notes. Slots `notices`, `aside`, `footer`.
- **Signature:** `Result(props: ResultProps)`

### share
- **Location:** packages/games/timeline/src/client/share.ts
- **Description:** Spoiler-free text `⏳ Tech Timeline #N` / `🟩🟥🟥🟩🟩 3/5` (the host appends the site line), identical in es/en; parses with `resultSchema`.
- **Signature:** `share(result: unknown, number: number): string`

### i18n / HELP_TARGET_ID / types
- **Location:** packages/games/timeline/src/client/i18n/index.ts, help-target.ts, types.ts, parse.ts
- **Description:** `i18n = { namespace: 'timeline', resources: { es, en } }`; `HELP_TARGET_ID = 'game-help'`; contract types (`GameProps`, `InstructionsProps`, `ResultProps`, `ClientBaseProps`, `MoveErrorInfo`, `GameStatsView`, `Translate`); `parsePublicView`, `parseState`, `parseFeedback`, `parseResult`.

### initialOrder / reorder / moveBy / sameIdSet
- **Location:** packages/games/timeline/src/client/order.ts
- **Description:** Pure ordering used by drag, keyboard and the buttons. `reorder` is `arrayMove`; `moveBy(order, id, -1 | 1)` returns the same array at the extremes; `sameIdSet` compares ids ignoring order.
- **Signature:** `initialOrder(view): string[]`; `reorder(order, from, to): string[]`; `moveBy(order, id, delta): string[]`; `sameIdSet(a, b): boolean`
- **Usage:** `moveBy(order, 'k1v3s8', -1)`

### positionMarks / squares
- **Location:** packages/games/timeline/src/client/marks.ts
- **Description:** Per submitted position: `{ opaque_id, label, position, correct, correctPosition }`; `squares` renders the 🟩/🟥 string used by `share`.
- **Signature:** `positionMarks(result: TimelineResult): PositionMark[]`; `squares(result): string`

### makeAnnouncements / makeScreenReaderInstructions
- **Location:** packages/games/timeline/src/client/announcements.ts
- **Description:** dnd-kit `Announcements` (start, over, end, cancel; 1-based position of 5, original position when there is no target) and `screenReaderInstructions`, translated through the game `t`.
- **Signature:** `makeAnnouncements(t, labelOf, positionOf): Announcements`; `makeScreenReaderInstructions(t): ScreenReaderInstructions`

### useTimelineSensors / MousePointerSensor
- **Location:** packages/games/timeline/src/client/sensors.ts
- **Description:** Mouse/pen-only `PointerSensor` (distance 4), `TouchSensor` (delay 150, tolerance 5) and `KeyboardSensor` with `sortableKeyboardCoordinates`, so a touch is handled only by `TouchSensor`.
- **Signature:** `useTimelineSensors(): SensorDescriptor<SensorOptions>[]`

### SortableRow / useRowSortable
- **Location:** packages/games/timeline/src/client/sortable-row.tsx, use-row-sortable.ts
- **Description:** `timeline.row` while playing: handle (only drag activator, `touch-none`), position, name and up/down buttons. `useRowSortable` wraps `useSortable` with no layout transition and the transform as `style`.
- **Signature:** `SortableRow({ id, label, index, blocked, t, onMove })`; `useRowSortable(id, disabled, roleDescription)`

### ConsoleHint / SectionPanel
- **Location:** packages/games/timeline/src/client/console-hint.tsx, section-panel.tsx
- **Description:** Copies of the Grep Grid pieces. `ConsoleHint` is a silent visible line plus a polite region with one keyed node per announcement; `SectionPanel` is a panel with a real `h2` `//` header and an optional `className`.

### Score / Rail / YourOrder
- **Location:** packages/games/timeline/src/client/score.tsx, rail.tsx, your-order.tsx
- **Description:** Result pieces: `Score` (`streak-number` `score`, composed locally), `Rail` (`timeline.rail`, date above the name via `formatEventDate`), `YourOrder` (rows with solid green or dashed amber border, badge and `sr-only` sentence).

### makeT
- **Location:** packages/games/timeline/src/client/test-utils.ts
- **Description:** Test-only translator: resolves dotted keys, interpolates `{{var}}`, throws on a missing key.

### Test fixtures
- **Location:** packages/games/timeline/src/client/test-fixtures.ts
- **Description:** Test-only: `PUBLIC_VIEW_ES`, `PUBLIC_VIEW_EN`, `PUBLIC_VIEW_OTHER`, `STATE_EMPTY`, `INITIAL_ORDER`, `RESULT_3_ES`, `RESULT_3_EN`, `RESULT_5_ES`, `RESULT_0_ES`.

## Generator

### generator / TimelineFact
- **Location:** packages/games/timeline/src/generator/index.ts
- **Description:** `GameGenerator<TimelinePayload, TimelineFact>`. `TimelineFact` is the bank item contract for `bankItems` of `timeline_facts` (S-028): `{ id, label, category, event_date, date_precision, note: { es, en }, last_used }`. `historySpec = { bank: 'timeline_facts', lastUsedField: 'last_used', recentDays: 90 }`. `verify` is the synchronous `verifyPayload`; the core contract types it `VerificationLog | Promise<VerificationLog>`, so unit tests of the checks call `verifyPayload` and tests that go through the contract use `await generator.verify(...)`. `historySpec` declares no `aheadDays` (default 0), fixed by a test in `src/generator/bank-usage.test.ts`.

### verifyPayload
- **Location:** packages/games/timeline/src/generator/verify.ts
- **Description:** Nine ordered checks (`items_count`, `facts_in_bank`, `item_category` (each item's category is valid and equals its fact's), `texts_bilingual`, `distinguishable`, `correct_order_consistent`, `opaque_ids`, `shuffled`, `not_used_90`); `reason` is the first failed one; never throws.

### eligibleFacts / isReusable / REUSE_WINDOW_DAYS / sortById
- **Location:** packages/games/timeline/src/generator/eligibility.ts
- **Description:** 90-day window plus exclusion of facts in recent challenges; stable order by `id`.

### chooseFacts
- **Location:** packages/games/timeline/src/generator/choose.ts
- **Description:** Greedy selection of 5 distinguishable facts from the whole bank, whatever the category (eligible ones shuffled with the rng first, then non-eligible ones when short); throws `RangeError` if the bank has fewer than 5 facts.
- **Signature:** `chooseFacts(eligible, bankItems, rng): TimelineFact[]`

### shuffle / drawOpaqueIds / drawInitialOrder / OPAQUE_ID_ALPHABET / MAX_REDRAWS / sameOrder
- **Location:** packages/games/timeline/src/generator/opaque.ts
- **Description:** Fisher-Yates on a copy; 5 unique 6-char ids from the rng (redrawn if alphabetical order equals chronological); initial permutation never the identity (up to 10 redraws).

### addDays / isValidDate
- **Location:** packages/games/timeline/src/generator/days.ts
- **Description:** Clock-free `YYYY-MM-DD` arithmetic in UTC (copy of Grep Grid: game packages cannot import each other).

### Test fixtures
- **Location:** packages/games/timeline/src/generator/test-fixtures.ts
- **Description:** Test-only: `DATE`, `DATE_V`, `seed(n)` (SHA-256 digest), `mk`, `BID`, `BANK_FIXTURE`, `BANK`, `BANK_TIGHT`, `history`.

## client Preview
- **Location:** packages/games/timeline/src/client/{preview.tsx,translate.ts}
- **Description:** `Preview({ payload, language })` admin solution-mode preview: `// consigna: ...` line and a `SectionPanel` (`h3`) with the `Rail` over the facts in `correct_order` (throws if an id is not in `items`). Parses with `payloadSchema`; no dnd-kit.
- **Signature:** `Preview(props: PreviewProps)`, `translatorFor(language: Locale): Translate`; `SectionPanel` gained `headingLevel?: 2 | 3`
- **Usage:** `const { Preview } = await import('@nerdose/game-timeline/client')`

## StatsSummary (REQ-011)

- **Location:** `src/client/stats-summary.tsx`, `src/client/stats.ts`, `src/client/stat-bar.tsx`
- **Description:** Own stats of Tech Timeline: accuracy per category (8 rows in `TIMELINE_CATEGORIES` order) and best category; `StatBar({ rate })` is the decorative `streak` bar (`aria-hidden`).
- **Signature:** `categoryRates(stats): { category; played; correct; rate: number | null }[]`, `bestCategory(stats): TimelineCategory | null`, `gamesCount(stats)`, `formatPercent(rate, locale)`
- **Usage:** `<StatsSummary extra={game.extra} locale="es" t={t} />`
