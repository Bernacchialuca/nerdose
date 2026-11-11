# Errors

## ERROR_CATALOG
- **Location:** packages/core/src/errors.ts
- **Description:** Closed catalog (`as const`) of 22 codes and HTTP statuses. `ErrorCode = keyof typeof ERROR_CATALOG`. Adding a code also requires ADR-015 and `docs/apis/api.yaml`.

## AppError
- **Location:** packages/core/src/errors.ts
- **Signature:** `new AppError(code: ErrorCode, message?: string)` with `code`, `status`, `name === 'AppError'`
- **Usage:** `throw new AppError('not_found')`
