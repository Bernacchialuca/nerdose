# Reports module

## Data layer
- **Location:** apps/admin/src/modules/reports/api/
- **Signature:** `useReportGroups(status)`, `useUpdateReport()` (`{ report_id, status }`), `useVoidChallenge()` (`{ challenge_id, void_reason, culprit }`), `reportKeys.all | list(status)`; types in `types.ts` mirror `docs/apis/api.yaml`
- **Description:** mutations invalidate `['admin','reports']` on settle (also after 409/404); void skips invalidation on 401.

## labels
- **Location:** apps/admin/src/modules/reports/labels.ts
- **Description:** Spanish label maps (`GAME_LABELS`, `REASON_LABELS`, status labels, `STATUS_TABS`), `challengeLabel(c)`, `reasonsSummary(reasons)`, `parseStatusParam(value)`.

## flattenPayload / readVerification
- **Location:** apps/admin/src/modules/reports/payload-view-model.ts
- **Description:** `flattenPayload(payload)` → `{ bilingual: {path, es, en}[], common: {path, value}[] }`; `readVerification(v)` → `{ kind: 'log' | 'raw' }`.

## voidSummary
- **Location:** apps/admin/src/modules/reports/components/void-summary.ts
- **Signature:** `voidSummary(challengeLabel, choice)` → `{ text, footnote? }`
