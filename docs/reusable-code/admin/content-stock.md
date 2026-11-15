# Content stock module (admin)

## useContentStock / contentStockKeys
- **Location:** apps/admin/src/modules/content-stock/api/
- **Description:** Single TanStack Query over `GET /api/admin/content/stock` (key `['admin','content-stock']`); no polling.
- **Usage:** `const query = useContentStock(); query.data?.banks`

## stock-model
- **Location:** apps/admin/src/modules/content-stock/stock-model.ts
- **Description:** Pure view model. `BANK_LABELS` (Record<BankName, {title, short, noun}>), `stockAlerts(data)` (one text per consumer with `cycle_ok === false`), `rejectionRows(data)` (banks concatenated, empty reason -> "Sin motivo registrado"), `windowLabel(days)`.
- **Usage:** `stockAlerts(data).map(...)`

## Panels
- **Location:** apps/admin/src/modules/content-stock/components/
- **Description:** `StockContent({ data })` composes `StockAlerts`, `LastSyncPanel`, one `BankPanel` per bank, `BankRejectionsPanel` and `TopRejectedPanel`. Helpers: `CycleStatus({ ok })`, `StatList({ pairs })`. `TableRegion` now lives in `apps/admin/src/components/table-region.tsx` (see components.md).

## Test helpers
- **Location:** apps/admin/src/test/msw.ts, apps/admin/src/test/fixtures/content-stock.ts
- **Description:** `adminHandlers.contentStock / contentStockPending / contentStockNetworkError`; fixtures `STOCK_OK`, `STOCK_LOW`, `STOCK_TERMS_LOW`, `STOCK_EMPTY`, `STOCK_NO_REASON`, `stock(overrides)`.
