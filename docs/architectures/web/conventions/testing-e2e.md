---
id: testing-e2e
display_name: Tests E2E (no adoptados, deuda D3)
language: react
description: "No e2e suite in the repo (debt D3); reference design for when it is adopted. The REQ-011 accessibility audit was one-off"
applies_to: [frontend]
required_by: []
package: null
---

# E2E Testing (React) — not adopted (debt D3)

## Current status

- **There is no e2e suite in the repo.** Playwright, `@axe-core/playwright`, `e2e/` and `playwright.config.ts` are **not** installed and MUST NOT be assumed by stories or plans. Critical flows are covered by route tests in jsdom (`testing-unit`), `vitest-axe` on components and manual verification.
- **Debt D3 stays open:** adopting e2e requires a running `api` with seeded challenges of every game (there is no `seed:dev`).
- **REQ-011 accessibility and mobile audit (S-059) was one-off:** Playwright + `@axe-core/playwright` were installed temporarily (mocking `/api/*` with `page.route` and fixtures typed with `api.yaml`), the violations were fixed, and then the dependencies, specs and configuration were removed. The result (violations found, fixes, accepted exceptions with justification) lives in `docs/audits/accesibilidad-REQ-011.md`. A future audit follows the same one-off approach unless D3 is closed.
- The rest of this document is the **reference design** to apply only if the user decides to adopt e2e (closing D3). It is not a current rule.

## Reference design (if e2e is adopted)

End-to-end tests would run in a real browser with **Playwright**, against the Vite app and a running `api` (same origin through the dev proxy). They would cover the critical flows and run **axe-core** on full pages. Unit and component behavior belongs to `testing-unit`.

## When to use

- Critical user flows: web (play -> finish -> streak, retake an open round, stats, language change), admin (login, void, regenerate).
- Accessibility and responsive checks on whole pages.
- Not for permutations of component states or game rules (unit tests and game packages).

## Package

```
@playwright/test                # runner, browsers, assertions
@axe-core/playwright            # accessibility checks on pages
```

## Structure

```
e2e/
├── playwright.config.ts
├── fixtures.ts                # test.extend: page helpers, axe, fake clock
├── helpers/
│   └── a11y.ts                # expectNoA11yViolations(page)
└── {flow}.spec.ts             # one file per flow
```

## Configuration

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5173',  // Vite dev server with proxy
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 320, height: 640 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: { command: 'pnpm dev', url: 'http://localhost:5173', reuseExistingServer: true },
});
```

- The app under test talks to the `api` through the Vite proxy, so cookies and relative URLs behave as in production. A test database with known challenges is the `api` side's responsibility; the specs assume seeded data.

## How to use

### A flow

```ts
test('play devdle to the result and see the streak', async ({ page }) => {
  await page.goto('/devdle');
  await page.getByRole('textbox', { name: /intento|guess/i }).fill('REDIS');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toBeVisible();
});
```

### Accessibility on full pages

```ts
// e2e/helpers/a11y.ts
import AxeBuilder from '@axe-core/playwright';
export async function expectNoA11yViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(violations).toEqual([]);
}
```

### Keyboard-only play

- At least one spec per game completes a round using only `keyboard` actions (NFR-U03), including Timeline reordering with the keyboard sensor.

### Time

- To test the day change use Playwright's clock (`page.clock`) to jump to the reset instead of waiting.

## Rules

- Select with roles, labels and text (`getByRole`, `getByLabel`); avoid CSS selectors.
- Each critical flow has a spec, and every page-level spec ends with `expectNoA11yViolations`.
- Every game has a keyboard-only spec (no mouse) that reaches its result.
- Run at 320 px (`mobile`) and desktop; assert no horizontal scroll at 320 px.
- Specs are independent: each starts from a known state and does not rely on another spec's data.
- No fixed `waitForTimeout`; rely on auto-waiting assertions.
- No spec reads or asserts the solution before the round ends.
- Keep the suite small: only flows that cannot be covered by unit tests.

## Integration with other conventions

- **accessibility**: while e2e is not adopted, WCAG 2.1 AA on real pages is verified by one-off audits (REQ-011: `docs/audits/accesibilidad-REQ-011.md`) plus `vitest-axe` on components.
- **styling**: 320 px layout is checked in those audits and manually.
- **routing**: if adopted, specs navigate by URL and by link.

## Update (REQ-011)

- The accessibility and mobile audit of REQ-011 (S-059) is one-off: Playwright + `@axe-core/playwright` are installed only while it runs, with `/api/*` mocked through `page.route` and fixtures typed with the `api.yaml` contracts (tags `wcag2a`, `wcag2aa`, `wcag21aa`; `mobile` 320 px and `desktop`, `admin` only `desktop`). When it ends, the dependencies, specs and Playwright configuration are removed and the report stays in `docs/audits/accesibilidad-REQ-011.md`. Playwright is not a current tool of the repo; flows against a real `api` remain open debt (D3).
