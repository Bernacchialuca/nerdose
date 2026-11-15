# Upcoming module

## Data layer
- **Location:** apps/admin/src/modules/upcoming/api/
- **Signature:** `useUpcoming()` (`GET /api/admin/challenges/upcoming?days=14`, `refetchInterval` 5 s only while some `regeneration.status === 'pending'`), `hasPendingRegeneration(data?)`, `useGenerationFailures()`, `useRegenerateChallenge()` (`{ challenge_id }`, POST with `json: {}`), `withPendingRegeneration(data, challengeId, res)`, `upcomingKeys.all | list(days)`, `failureKeys.all`; types mirror `docs/apis/api.yaml`
- **Description:** the mutation writes the pending `regeneration` of the cell into the cache from the `202` and invalidates `['admin','upcoming']` on settle (not on 401). Only `useGenerationFailures`, `upcomingKeys` and `failureKeys` are public (`@/modules/upcoming`).

## cell-state
- **Location:** apps/admin/src/modules/upcoming/cell-state.ts
- **Signature:** `cellState(game)` → `{ kind, lines, canRegenerate, canOpen }`, `cellBadges(game)`, `LEGEND`, `rowLabel(day)` → `'05/12 #35'`, `windowSubtitle(data)`, `upcomingAlerts(data)` → `{ failures, pending, regenFailed }`
- **Description:** pure view model; never uses `Date` to decide the window.

## registry
- **Location:** apps/admin/src/modules/upcoming/registry.ts
- **Signature:** `hasPreview(gameId)`, `previewComponent(gameId)` (memoized `React.lazy`)
- **Description:** the only file that lists games (`big-o`, `bug-hunt`, `devdle`, `grep-grid`, `timeline`); a game without entry falls back to `PayloadBilingual` (defensive path: all 5 games have a `Preview` today).

## ChallengePreview / PreviewErrorBoundary
- **Location:** apps/admin/src/modules/upcoming/components/challenge-preview.tsx, preview-error-boundary.tsx
- **Signature:** `<ChallengePreview gameId payload />`
- **Description:** two `Panel`s (ES, EN) mounting the game `Preview`; render errors show a warning plus `PayloadBilingual`.

## Components
- **Location:** apps/admin/src/modules/upcoming/components/
- **Description:** `UpcomingGrid` (accessible day × game table), `UpcomingAlerts` (persistent `aria-live` region), `UpcomingChallengeDrawer` (O-02 from upcoming), `RegenerateDialog` (O-03).
