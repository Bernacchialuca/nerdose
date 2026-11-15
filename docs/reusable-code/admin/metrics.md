# Metrics module (admin)

## useMetrics / metricsKeys
- **Location:** apps/admin/src/modules/metrics/api/
- **Signature:** `useMetrics(range: { from: string; to: string } | null)`; `metricsKeys.all`, `metricsKeys.range(from, to)`
- **Description:** TanStack Query over `GET /api/admin/metrics?from&to`; `enabled` only with a range; no polling. Types (`MetricsResponse`, `ChallengeQualityRow`, ...) mirror `api.yaml`.
- **Usage:** `const query = useMetrics(problem ? null : range); query.data?.summary`

## range
- **Location:** apps/admin/src/modules/metrics/range.ts
- **Signature:** `defaultRange(now)`, `readRange(params, now)`, `rangeCheck(from, to, todayUtc) => { message, invalid } | null`
- **Description:** Last 30 days UTC by default; URL values that are not real `YYYY-MM-DD` read as `''`; `rangeCheck` adds the empty case on top of core's `validateMetricsRange`.
- **Usage:** `rangeCheck(draft.from, draft.to, today(new Date()))`

## metrics-model
- **Location:** apps/admin/src/modules/metrics/metrics-model.ts
- **Signature:** `formatPercent(v | null)`, `dailyRows(daily, from, to)`, `retentionRows(rows)`, `streakRows(dist)`, `sortQuality(rows, sort)`, `nextSort(sort, key)`, `challengeCell(row)`; constants `NOTES`, `EMPTY_RANGE`, `QUALITY_COLUMNS`, `DEFAULT_QUALITY_SORT`, `STREAK_LABELS`
- **Description:** Pure view model: one-decimal percentages with `—` for `null`, days without plays filled with 0, quality sort with `null` always last.
- **Usage:** `sortQuality(data.challenge_quality, { key: 'reports', dir: 'ascending' })`

## Components
- **Location:** apps/admin/src/modules/metrics/components/
- **Description:** `MetricsView({ urlRange, onSubmit })` (draft range, state precedence), `RangeForm`, `RangeAlert`, `SystemAlert`, `LoadingNotice`, `MetricsContent({ data, range })`, `SummaryFigures`, `DailyPlayersTable`, `RetentionTable`, `StreakTable`, `QualityTable` (sortable, `aria-sort`), `EmptyRow({ colSpan })`.
- **Usage:** `<MetricsContent data={query.data} range={urlRange} />`
