# Content stock module (admin)

## useContentStock / contentStockKeys
- **Location:** apps/admin/src/modules/content-stock/api/
- **Description:** Single TanStack Query over `GET /api/admin/content/stock` (key `['admin','content-stock']`); no polling.
- **Usage:** `const query = useContentStock(); query.data?.banks`

## stock-model
- **Location:** apps/admin/src/modules/content-stock/stock-model.ts
- **Description:** Pure view model. `BANK_LABELS` (Record<BankName, {title, short, noun}>), `stockAlerts(data)` (one text per consumer with `cycle_ok === false`), `windowLabel(days)`. `rejectionRows` was removed in REQ-012 (the rejected list lives in Bancos).
- **Usage:** `stockAlerts(data).map(...)`

## Panels
- **Location:** apps/admin/src/modules/content-stock/components/
- **Description:** `StockContent({ data })` composes `StockAlerts`, `LastSyncPanel`, one full-width `BankPanel` per bank, `BankRejectionsLink` (rejected count per bank with a link to `/banks`; replaced the `BankRejectionsPanel` table in REQ-012) and `TopRejectedPanel` (top 50 paged by 10 with `usePagination`). `approved_available`, `days_of_stock` and `cycle_ok` arrive from the api already without each game's `bankUsage.excludedItems`. Helpers: `CycleStatus({ ok })`, `StatList({ pairs })`. `TableRegion` now lives in `apps/admin/src/components/table-region.tsx` (see components.md).

## Test helpers
- **Location:** apps/admin/src/test/msw.ts, apps/admin/src/test/fixtures/content-stock.ts
- **Description:** `adminHandlers.contentStock / contentStockPending / contentStockNetworkError`; fixtures `STOCK_OK`, `STOCK_LOW`, `STOCK_TERMS_LOW`, `STOCK_EMPTY`, `STOCK_NO_REASON`, `stock(overrides)`.
