# Devdle package

## devdle (GameDefinition)
- **Location:** packages/games/devdle/src/definition/index.ts
- **Description:** Implements every `GameDefinition` method. `toPublic` returns `{ length, possible_categories }` (the 8 categories, fixed order, no solution). `applyMove` validates in order: finished game (won, 6 guesses or `gave_up`) → `invalid_move`; `{ give_up: true }` sets `state.gave_up` (feedback `{ gave_up: true }`, closes as a loss); `{ hint }` reveals `word[hint]` once per game into `state.hint` (feedback `{ hint: { position, letter } }`, no attempt used; a second hint or a position ≥ length → `invalid_move`); a guess checks shape and length (`invalid_move`) and the word list through `ctx.isValidWord` (`not_in_word_list`; the answer itself is always accepted). `result` resolves `definition` and `summary` to the locale and carries `hint` (or `null`) and `gave_up: true` only when the player gave up. A loss (including a give up) scores 6 and its label is `✗ X/6` (REQ-012). Never mutates its arguments. `culprits(p)` returns 1 `term` (`term_id`, `word`); contains the solution, admin-only, matches `generator.usedBankItems` (checked in `src/generator/culprits.test.ts`). Declares `bankUsage` (`terms`, `last_used_devdle`, 365 days, 1 item per challenge; the window is `REUSE_WINDOW_DAYS`, not `historySpec.recentDays` which is 3); `src/generator/bank-usage.test.ts` ties it to `historySpec`, `REUSE_WINDOW_DAYS` and `usedBankItems`. Implements `codeLanguage: () => null` (no code in this game; the `plays.code_language` CHECK only allows big-o and bug-hunt); tests in `src/definition/definition.test.ts` (initial and closed state, registry, type, purity).
- **Signature:** `devdle: GameDefinition<DevdlePayload, DevdlePublicView, DevdleState, DevdleMove, DevdleFeedback, DevdleResult, DevdleStats>`
- **Usage:** `import { devdle } from '@nerdose/game-devdle/definition'; createGameRegistry([devdle])`

## scoreGuess
- **Location:** packages/games/devdle/src/definition/feedback.ts
- **Signature:** `scoreGuess(answer: string, guess: string): LetterMark[]` (same length precondition)
- **Usage:** `scoreGuess('REACT', 'CACHE') // ['present','present','absent','absent','present']`

## Schemas and types
- **Location:** packages/games/devdle/src/definition/schemas.ts (re-exported by `./definition`)
- **Description:** `payloadSchema` also carries `date` (`YYYY-MM-DD`) so `verify` can check the 365-day rule. The api parses stored jsonb with `payloadSchema.parse(challenge.payload)`. `moveSchema = union(guessMoveSchema, hintMoveSchema, giveUpMoveSchema)` (strict objects); `revealedHintSchema = { position: 0–11, letter: A–Z }`; `stateSchema.hint` and `.gave_up`, `resultSchema.hint` (nullable) and `.gave_up` are optional so plays and results saved before REQ-012 still parse.

## Devdle client
- **Location:** packages/games/devdle/src/client/index.ts
- **Description:** `./client` entry. `Instructions`, `Game`, `Result` render the three screens; `web` passes data as `unknown` and the client parses it with the `./definition` schemas (a `ZodError` goes to the route error boundary). Slots: `notices` (all), `actions` (Instructions), `aside` (Result). `i18n` exposes the `devdle` namespace resources; the client does not depend on react-i18next. `HELP_TARGET_ID` (`game-help`) is the id of the how-to-play section and legend.
- **Signature:** `Instructions(props: InstructionsProps)`, `Game(props: GameProps)`, `Result(props: ResultProps)`, `share(result: unknown, number: number): string`, `i18n: { namespace: 'devdle'; resources: { es; en } }`, `HELP_TARGET_ID: 'game-help'`
- **Usage:** `const { Game, i18n } = await import('@nerdose/game-devdle/client')`

## Devdle client internals (reference for other games)
- **Preview** (`preview.tsx`): `({ payload, language })` admin solution-mode preview; `translatorFor(language)` (`translate.ts`) resolves `i18n.resources[language]` and returns the key when missing. `PreviewProps` in `types.ts`.
- **SectionPanel** gains `headingLevel?: 2 | 3` (default 2); **WordCard** takes `result: Pick<DevdleResult, 'word'|'category'|'definition'|'summary'>` and `headingLevel?`.
- **SectionPanel** (`section-panel.tsx`): `({ title, datum?, id?, children })` panel with `// title` as `h2`.
- **Board** (`board.tsx`): `({ length, guesses, draft?, rows?, hint?, pickable?, onPick?, label, t })` grid scaled with CSS variables (`--board-cols`, `--board-max`, `--tile-font`). `hint` shows the revealed letter as a `hinted` cell in the active row; `pickable` overlays a button on those positions of the active row while the player picks the hint cell (REQ-012).
- **LetterHintButton** (`letter-hint-button.tsx`): `({ hint, picking, disabled, onToggle, t })` aside trigger «💡 Pista» → «Cancelar» while picking → disabled «💡 Letra N: X» once used (`secondary`, full width).
- **SurrenderButton / SurrenderDialog** (`surrender.tsx`): «⚑ Rendirse» (`buttonClass` `error-outline`) and the `Dialog` `alertdialog` confirmation («Seguir jugando» focused, «Sí, rendirme» `error`, «Cerrando…» while busy).
- **useDevdleInput** (`use-devdle-input.ts`): `({ enabled, onLetter, onBackspace, onSubmit, onInvalid })` window keydown handler; ignores modifiers and leaves Enter/Space to focused buttons.
- **keyStates / isFinished** (`marks.ts`): best letter state per key and finished-game rule without importing `definition/index.ts`.

## generator
- **Location:** packages/games/devdle/src/generator/index.ts
- **Description:** `historySpec = { bank: 'terms', lastUsedField: 'last_used_devdle', recentDays: 3 }`. `generate` filters eligible terms with `eligibleTerms` (`eligibility.ts`): reusable (`last_used_devdle` null or `<= date - 365`), not in `DEVDLE_EXCLUDED_TERMS` (`excluded.ts`, 115 niche terms that stay in the bank for Grep Grid and as valid guesses), and outside the categories returned by `blockedCategories` (the strictest of three rotation tiers that leaves a candidate: categories of the last `RECENT_DAYS` = 3 days → only yesterday's → none); sorts by `term` and picks with `rngFrom(seed)`; with no eligible term it picks from the whole bank so `verify` rejects it. `verify` runs `word_shape`, `texts_bilingual`, `term_in_bank`, `not_used_365`, `category_rotation` (same `blockedCategories` rule), `not_excluded` (all evaluated; `reason` is the first failure). REQ-012/S-065. `verify` is the synchronous `verifyPayload`; the core contract types it `VerificationLog | Promise<VerificationLog>`, so unit tests of the checks call `verifyPayload` and tests that go through the contract use `await generator.verify(...)`. `historySpec` declares no `aheadDays` (default 0), fixed by a test in `src/generator/bank-usage.test.ts`.
- **Signature:** `generator: GameGenerator<DevdlePayload, DevdleTerm>`; `DevdleTerm = { id, term, category, definition: {es,en}, summary: {es,en}, last_used_devdle: string | null }`
- **Usage:** `import { generator as devdle } from '@nerdose/game-devdle/generator'`

## build:wordlist
- **Location:** packages/games/devdle/scripts/build-wordlist.ts and scripts/build-wordlist/
- **Description:** Offline only. Builds `wordlist/words.txt` (ENABLE A-Z 4-12 union English Wikidata labels), committed and exposed as `./wordlist` (data resource read with `node:fs`).
- **Signature:** `runBuildWordlist({ enable, outPath, contact, classes?, now?, fetch?, sleep?, log? }): Promise<{ enable, wikidata, onlyWikidata, total }>`
- **Usage:** `pnpm --filter @nerdose/game-devdle build:wordlist --enable <url-or-path>`

## StatsSummary (REQ-011)

- **Location:** `src/client/stats-summary.tsx`, `src/client/stats.ts`, `src/client/distribution-bars.tsx`
- **Description:** Own stats of Devdle. `StatsSummary({ extra, locale, t })` parses `extra` with `parseStats`, shows the attempts distribution (1..6 and X) with `DistributionBars` or only `stats.none` without games.
- **Signature:** `distributionRows(stats): { label; count }[]`, `gamesCount(stats): number`, `formatPercent(rate: number | null, locale): string`, `DistributionBars({ rows, highlight?, t })`
- **Usage:** `<StatsSummary extra={game.extra} locale="es" t={t} />`
