# Game contract

## GAME_IDS, GameId, Locale, MoveError
- **Location:** packages/core/src/game-definition.ts
- **Description:** `GAME_IDS` is the runtime list of the five ids; `GameId` derives from it. `Locale = 'es' | 'en'`. `MoveError = 'invalid_move' | 'not_in_word_list'`.

## GameDefinition
- **Location:** packages/core/src/game-definition.ts
- **Signature:** `GameDefinition<Payload, PublicView, State, Move, Feedback, Result, Stats>` (exact to ADR-006); `toPublic(p: Payload, locale: Locale, state?: State): PublicView`
- **Notes:** the api passes `state` to `toPublic` only while the Play is `in_progress`; with a state, only what the player already discovered is revealed. Implementations that do not need it declare fewer parameters.
- **Usage:** each `packages/games/<id>` exports an object implementing it.

## GameDefinition.codeLanguage
- **Location:** packages/core/src/game-definition.ts
- **Signature:** `codeLanguage(s: State): CodeLanguage | null` (required member)
- **Usage:** the api calls it through the registry when closing a Play: `plays.code_language = def.codeLanguage(state)` and, if not null, `players.preferred_code_language`; also feeds `MoveResponse.play.code_language`. Big O and Bug Hunt return the confirmed language; Devdle, Grep Grid and Timeline return `() => null`.

## MoveContext and applyMove
- **Location:** packages/core/src/game-definition.ts
- **Signature:** `interface MoveContext { isValidWord(word: string): boolean; locale: Locale }`; `applyMove(p, s, m, now, ctx: MoveContext)`
- **Usage:** api calls `def.applyMove(payload, state, move, now, { isValidWord: wordList.has, locale })`; a game uses `ctx.locale` to localize its `Feedback` (never `{ es, en }`); games that do not need `ctx` declare fewer parameters and ignore it. `locale` is required when building a `MoveContext`.

## GameGenerator, GeneratorHistory, VerificationLog, AnyGameGenerator
- **Location:** packages/core/src/game-generator.ts
- **Signature:** `GameGenerator<Payload, BankItem = unknown> { historySpec: HistorySpec; usedBankItems(p): string[]; generate({ date, seed, history }): Payload; verify(p, history): VerificationLog | Promise<VerificationLog> }`; `HistorySpec = { bank, lastUsedField, recentDays, aheadDays?: number }` (`aheadDays` default 0 applied by the consumer; the row of D is excluded); `GeneratorHistory<Payload, BankItem> = { bankItems, recentChallenges: { date, payload }[] }`; `VerificationLog = { ok, checks: { name, ok, detail? }[], reason? }`; `AnyGameGenerator = GameGenerator<any, any>`
- **Usage:** `const log = await gen.verify(payload, history); if (!log.ok) retry` (log is stored in `challenges.verification`).

## Culprit, CulpritKind and culprits(p)
- **Location:** packages/core/src/game-definition.ts
- **Signature:** `type CulpritKind = 'term' | 'timeline_fact'`; `interface Culprit { kind: CulpritKind; id: string; label: string }`; `GameDefinition.culprits(p: Payload): Culprit[]`
- **Usage:** Devdle returns 1 `term`, Grep Grid 8 `term`, Timeline 5 `timeline_fact`; Big O and Bug Hunt return `[]`. The api uses it to validate the culprit when voiding.

## BankUsage and GameDefinition.bankUsage
- **Location:** packages/core/src/game-definition.ts
- **Signature:** `interface BankUsage { bank: BankName; lastUsedField: string; windowDays: number; itemsPerChallenge: number; excludedItems?: ReadonlySet<string> }`; `GameDefinition.bankUsage: BankUsage | null`
- **Usage:** Devdle `terms`/`last_used_devdle`/365/1, Grep Grid `terms`/`last_used_grep`/30/8, Timeline `timeline_facts`/`last_used`/90/5; Big O and Bug Hunt `null`. The api builds the content stock from the registry (`reg.ids().map(reg.get).filter(g => g.bankUsage)`), without per-game constants. `excludedItems` (optional, REQ-012/S-067): item texts (`terms.term`, `timeline_facts.label`) the game's generator never picks; the api leaves them out of that game's stock and lists them as `excluded_from` in `GET /api/admin/content/items` (Devdle: `DEVDLE_EXCLUDED_TERMS`).
