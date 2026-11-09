# Reusable Code Index - games

Package `@nerdose/game-devdle` (`packages/games/devdle`), entries `./definition`, `./client`, `./generator` and data resource `./wordlist`. The build script lives in `scripts/` and is never importable from `src/` or other packages.

## Devdle definition (6 items) - see devdle.md
- **devdle / definition** (packages/games/devdle/src/definition/index.ts) - `GameDefinition` of Devdle (`id: 'devdle'`, `version: 1`); `definition` is an alias
- **scoreGuess** (packages/games/devdle/src/definition/feedback.ts) - Pure per-letter feedback with repeated-letter handling (`correct` first, then left-to-right `present`)
- **payloadSchema / moveSchema / guessSchema / stateSchema / publicViewSchema / resultSchema / statsSchema / letterMarkSchema** (packages/games/devdle/src/definition/schemas.ts) - Zod schemas, snake_case as in `api.yaml`
- **WORD_PATTERN / MAX_GUESSES** (packages/games/devdle/src/definition/schemas.ts) - `/^[A-Z]{4,12}$/` and 6
- **DevdlePayload / DevdleMove / DevdleGuess / DevdleFeedback / DevdleState / DevdlePublicView / DevdleResult / DevdleStats / LetterMark** (packages/games/devdle/src/definition/schemas.ts) - Types inferred from the schemas
- **PAYLOAD_REACT / PAYLOAD_MERGE / ALL_VALID / NONE_VALID / NOW** (packages/games/devdle/src/definition/test-fixtures.ts) - Test-only fixtures, not exported from the entry

## Devdle client (9 items) - see devdle.md
- **Instructions / Game / Result** (packages/games/devdle/src/client/{instructions,game,result}.tsx) - React screens of the `./client` entry; game data props are `unknown` and parsed with the definition schemas
- **share** (packages/games/devdle/src/client/share.ts) - `share(result, number)`: `🟩 Devdle #N · k/6`, one emoji row per try, `nerdose.dev`; never the solution
- **i18n** (packages/games/devdle/src/client/i18n/index.ts) - `{ namespace: 'devdle', resources: { es, en } }` for web to register
- **HELP_TARGET_ID** (packages/games/devdle/src/client/help-target.ts) - `'game-help'`
- **Translate / ClientBaseProps / InstructionsProps / GameProps / ResultProps / MoveErrorInfo / GameStatsView** (packages/games/devdle/src/client/types.ts) - Prop contract
- **SectionPanel** (packages/games/devdle/src/client/section-panel.tsx) - Panel with a `//` header as `h2`
- **Board** (packages/games/devdle/src/client/board.tsx) - Scalable 4-12 column grid with non-chromatic glyphs
- **useDevdleInput** (packages/games/devdle/src/client/use-devdle-input.ts) - Physical keyboard normalized into letter/backspace/submit/invalid
- **keyStates / isFinished / MARK_EMOJI / MARK_GLYPH** (packages/games/devdle/src/client/marks.ts) - Pure helpers

## Devdle generator (5 items) - see devdle.md
- **generator / DevdleTerm** (packages/games/devdle/src/generator/index.ts) - `GameGenerator<DevdlePayload, DevdleTerm>` with `historySpec`, `usedBankItems`, `generate`, `verify`
- **verifyPayload** (packages/games/devdle/src/generator/verify.ts) - Five ordered checks returning a `VerificationLog`
- **eligibleTerms / sortByTerm / isReusable / REUSE_WINDOW_DAYS / RECENT_DAYS** (packages/games/devdle/src/generator/eligibility.ts) - 365-day and category-rotation filter, ordinal ordering by `term`
- **addDays / isValidDate** (packages/games/devdle/src/generator/dates.ts) - Clock-free `YYYY-MM-DD` arithmetic in UTC
- **BANK / seed / payloadFrom / RECENT_GIT_DB_LINUX** (packages/games/devdle/src/generator/test-fixtures.ts) - Test-only fixtures (`seed(n)` is a SHA-256 digest: uniform seeds collapse to a zero state in `rngFrom`)

## Word list script (5 items) - see devdle.md
- **runBuildWordlist / EmptySourceError** (packages/games/devdle/scripts/build-wordlist/run.ts) - Orchestration of `build:wordlist`; validates sources before writing, writes atomically
- **buildWordList / filterWords / serializeWordList** (packages/games/devdle/scripts/build-wordlist/words.ts) - ENABLE filtered union Wikidata labels, uppercase, sorted, no duplicates
- **createHttpClient / buildUserAgent / HttpRequestError** (packages/games/devdle/scripts/build-wordlist/http.ts) - Polite HTTP client (`getText`, `getJson`): User-Agent, pause, retries with backoff
- **buildLabelsQuery / parseLabels / fetchClassLabels** (packages/games/devdle/scripts/build-wordlist/wikidata.ts) - SPARQL access to English labels per class
- **loadWordlistEnv / parseWordlistArgs / WORDLIST_CLASSES** (packages/games/devdle/scripts/build-wordlist/{env,args,classes}.ts) - `WIKIMEDIA_CONTACT`, `--enable` and the QID list
