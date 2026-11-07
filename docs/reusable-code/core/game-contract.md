# Game contract

## GAME_IDS, GameId, Locale, MoveError
- **Location:** packages/core/src/game-definition.ts
- **Description:** `GAME_IDS` is the runtime list of the five ids; `GameId` derives from it. `Locale = 'es' | 'en'`. `MoveError = 'invalid_move' | 'not_in_word_list'`.

## GameDefinition
- **Location:** packages/core/src/game-definition.ts
- **Signature:** `GameDefinition<Payload, PublicView, State, Move, Feedback, Result, Stats>` (exact to ADR-006)
- **Usage:** each `packages/games/<id>` exports an object implementing it.

## MoveContext and applyMove
- **Location:** packages/core/src/game-definition.ts
- **Signature:** `interface MoveContext { isValidWord(word: string): boolean }`; `applyMove(p, s, m, now, ctx: MoveContext)`
- **Usage:** api calls `def.applyMove(payload, state, move, now, { isValidWord: wordList.has })`; games that do not need it declare fewer parameters.

## GameGenerator, GeneratorHistory, VerificationLog, AnyGameGenerator
- **Location:** packages/core/src/game-generator.ts
- **Signature:** `GameGenerator<Payload, BankItem = unknown> { historySpec: HistorySpec; usedBankItems(p): string[]; generate({ date, seed, history }): Payload; verify(p, history): VerificationLog }`; `GeneratorHistory<Payload, BankItem> = { bankItems, recentChallenges: { date, payload }[] }`; `VerificationLog = { ok, checks: { name, ok, detail? }[], reason? }`; `AnyGameGenerator = GameGenerator<any, any>`
- **Usage:** `const log = gen.verify(payload, history); if (!log.ok) retry` (log is stored in `challenges.verification`).
