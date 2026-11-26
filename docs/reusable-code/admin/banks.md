# Banks module (admin)

P-06 «Bancos» (`/banks`), added in REQ-012 (S-068).

## useBankItems / bankItemsKeys / bankItemsPath / BANK_PAGE_SIZE
- **Location:** apps/admin/src/modules/banks/api/use-bank-items.ts, types.ts
- **Signature:** `useBankItems(q: BankItemsQuery)`; `bankItemsPath(q): string`; `bankItemsKeys.all | list(q)`; `BANK_PAGE_SIZE = 25`
- **Description:** TanStack Query over `GET /api/admin/content/items?bank&page&page_size=25[&q][&status][&category]` with `placeholderData: keepPreviousData`, so the previous page stays visible while the next one loads. Types mirror `ContentItem` and the page response of `docs/apis/api.yaml`.
- **Usage:** `const query = useBankItems(parseBankQuery(searchParams))`

## labels
- **Location:** apps/admin/src/modules/banks/labels.ts
- **Signature:** `BANK_TABS`, `categoryOptions(bank)`, `categoryLabel(bank, category)`, `reasonLabel(reason)`, `STATUS_OPTIONS`, `parseBankQuery(params: URLSearchParams): BankItemsQuery`, `bankQueryParams(q): Record<string, string>`
- **Description:** pure view model in Spanish. `parseBankQuery` falls back to defaults for invalid values (unknown bank -> `terms`, a category of another bank or an unknown status -> none, page < 1 -> 1, `q` trimmed to 50); `bankQueryParams` always writes `bank` and only the non-default filters and page.

## BankItemsTable
- **Location:** apps/admin/src/modules/banks/components/bank-items-table.tsx
- **Description:** accessible table of a page of items: label and description, «fuera de Devdle» badge when `excluded_from` has `devdle`, status with the readable rejection reason, last use per consuming game, event date (facts only) and sitelinks.

## Banks route
- **Location:** apps/admin/src/modules/banks/routes/banks.tsx
- **Description:** tabs Términos / Hechos (switching clears the filters), search with a 300 ms debounce (or Enter), status and category filters, all in the URL; server-side `Pagination`.

## Test helpers
- **Location:** apps/admin/src/test/fixtures/banks.ts, apps/admin/src/test/msw.ts
- **Description:** bank item fixtures and `adminHandlers.bankItems(body | (url) => body)` / `adminHandlers.bankItemsNetworkError()` for `GET /api/admin/content/items`.
