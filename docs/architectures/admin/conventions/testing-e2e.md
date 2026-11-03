---
id: testing-e2e
display_name: Tests E2E (Playwright)
language: react
description: "End-to-end tests with Playwright and axe-core against the built SPA and a real api"
applies_to: [frontend]
required_by: []
package: "@playwright/test"
---

# E2E Testing (React, Playwright)

End-to-end tests run in a real browser with **Playwright**, against the Vite app and a running `api` (same origin through the dev proxy). They cover the critical flows and run **axe-core** on full pages. Unit and component behavior belongs to `testing-unit`.

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
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:5174',  // Vite dev server with proxy (admin port; web uses 5173)
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 5'], viewport: { width: 320, height: 640 } } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: { command: 'pnpm dev', url: 'http://localhost:5174', reuseExistingServer: true },
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

- **accessibility**: e2e is where WCAG 2.1 AA is verified on real pages.
- **styling**: the 320 px project validates mobile-first layout.
- **routing**: specs navigate by URL and by link.
