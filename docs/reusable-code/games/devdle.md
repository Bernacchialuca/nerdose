# Devdle package

## devdle (GameDefinition)
- **Location:** packages/games/devdle/src/definition/index.ts
- **Description:** Implements every `GameDefinition` method. `toPublic` returns `{ length, possible_categories }` (the 8 categories, fixed order, no solution). `applyMove` validates in order: finished game, shape and length (`invalid_move`), word list through `ctx.isValidWord` (`not_in_word_list`; the answer itself is always accepted). `result` resolves `definition` and `summary` to the locale. A loss scores 6 and its label is `✗ X/6`. Never mutates its arguments.
- **Signature:** `devdle: GameDefinition<DevdlePayload, DevdlePublicView, DevdleState, DevdleMove, DevdleFeedback, DevdleResult, DevdleStats>`
- **Usage:** `import { devdle } from '@nerdose/game-devdle/definition'; createGameRegistry([devdle])`

## scoreGuess
- **Location:** packages/games/devdle/src/definition/feedback.ts
- **Signature:** `scoreGuess(answer: string, guess: string): LetterMark[]` (same length precondition)
- **Usage:** `scoreGuess('REACT', 'CACHE') // ['present','present','absent','absent','present']`

## Schemas and types
- **Location:** packages/games/devdle/src/definition/schemas.ts (re-exported by `./definition`)
- **Description:** `payloadSchema` also carries `date` (`YYYY-MM-DD`) so `verify` can check the 365-day rule. The api parses stored jsonb with `payloadSchema.parse(challenge.payload)`.

## generator
- **Location:** packages/games/devdle/src/generator/index.ts
- **Description:** `historySpec = { bank: 'terms', lastUsedField: 'last_used_devdle', recentDays: 3 }`. `generate` filters eligible terms (`last_used_devdle` null or `<= date - 365`, category not among `recentChallenges`), sorts by `term` and picks with `rngFrom(seed)`; with no eligible term it picks from the whole bank so `verify` rejects it. `verify` runs `word_shape`, `texts_bilingual`, `term_in_bank`, `not_used_365`, `category_rotation` (all evaluated; `reason` is the first failure).
- **Signature:** `generator: GameGenerator<DevdlePayload, DevdleTerm>`; `DevdleTerm = { id, term, category, definition: {es,en}, summary: {es,en}, last_used_devdle: string | null }`
- **Usage:** `import { generator as devdle } from '@nerdose/game-devdle/generator'`

## build:wordlist
- **Location:** packages/games/devdle/scripts/build-wordlist.ts and scripts/build-wordlist/
- **Description:** Offline only. Builds `wordlist/words.txt` (ENABLE A-Z 4-12 union English Wikidata labels), committed and exposed as `./wordlist` (data resource read with `node:fs`).
- **Signature:** `runBuildWordlist({ enable, outPath, contact, classes?, now?, fetch?, sleep?, log? }): Promise<{ enable, wikidata, onlyWikidata, total }>`
- **Usage:** `pnpm --filter @nerdose/game-devdle build:wordlist --enable <url-or-path>`
