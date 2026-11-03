---
id: testing-unit
display_name: Tests unitarios (Vitest + Testing Library)
language: react
description: "Unit and component tests with Vitest, Testing Library and axe-core for the SPAs"
applies_to: [frontend]
required_by: []
package: vitest
---

# Unit Testing (React, Vitest, Testing Library)

Unit and component tests run on **Vitest** with **React Testing Library** in jsdom. They exercise behavior as the user sees it (roles, labels, text) and run a quick **axe-core** check on rendered components. Full flows against a real browser belong to `testing-e2e`.

## When to use

- Components, hooks and pure helpers of the app.
- Not for full user flows (see `testing-e2e`) and not for game rules (they are tested in the game packages).

## Package

```
vitest                          # runner (shares config with Vite)
jsdom                           # DOM environment
@testing-library/react          # render, screen, waitFor
@testing-library/user-event     # realistic interaction
@testing-library/jest-dom       # DOM matchers
vitest-axe                      # axe-core matchers (toHaveNoViolations)
msw                             # network mocking at the fetch boundary
```

## Configuration

```ts
// vitest.config.ts
import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: false,
    css: false,
  },
}));
```

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
afterEach(cleanup);
```

## Structure

```
src/
├── modules/catalog/components/game-card.tsx
├── modules/catalog/components/game-card.test.tsx   # next to the unit
└── test/
    ├── setup.ts
    ├── render.tsx            # renderWithProviders (QueryClient, Router, i18n when web)
    └── fixtures/             # API responses in snake_case
```

## How to use

### Component

```tsx
it('shows the play state of a game', async () => {
  renderWithProviders(<GameCard game={fixtures.today.games[0]} />);
  expect(screen.getByRole('link', { name: /devdle/i })).toBeInTheDocument();
  expect(screen.getByText('✓ 4/6')).toBeVisible();
});
```

### Accessibility check

```tsx
import { axe } from 'vitest-axe';
it('has no axe violations', async () => {
  const { container } = renderWithProviders(<GameCard game={fixtures.today.games[0]} />);
  expect(await axe(container)).toHaveNoViolations();
});
```

### Network

- Mock at the network boundary with MSW handlers returning fixtures copied from `docs/apis/api.yaml` examples (`snake_case`, error shape `{ error: { code, message } }`). Do not mock `fetch` call by call inside components.

### Time

- Use `vi.useFakeTimers()` and `vi.setSystemTime()` for countdowns, polling and day-change jitter. Never depend on the real clock.

### Hooks

- Test hooks through a component or `renderHook` wrapped in the providers.

## Rules

- Query by role, label or visible text. `data-testid` only when no accessible query exists.
- Use `userEvent`, not `fireEvent`, for interactions.
- Each interactive component has an axe check; fix violations instead of disabling rules.
- Fixtures use the API's `snake_case` names; do not write camelCase fixtures.
- Mock the network with MSW, never the app's own modules (api client, hooks) except to isolate a single unit.
- No snapshot tests of large DOM trees.
- Tests do not rely on the real date or timers; use fake timers.
- Test names state the behavior ("shows ... when ..."), not the implementation.
- Tests never hit a real `api`.

## Integration with other conventions

- **data-fetching**: MSW handlers emulate the same-origin `/api` routes and `ApiError` bodies.
- **error-handling**: error codes are asserted by the user-visible recovery, not by internals.
- **accessibility**: the axe check here is the first line; e2e runs it on full pages.
