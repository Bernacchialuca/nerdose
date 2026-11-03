---
id: analytics
display_name: Analítica (Plausible opcional)
language: react
description: "Opt-in Plausible analytics through the track() helper of @nerdose/ui, off by default"
applies_to: [frontend]
required_by: []
package: "@nerdose/ui"
---

# Analytics (React, Plausible)

`web` can report pageviews and share events to a self-hosted **Plausible CE**, with no cookies and no banner (NFR-PR01, NFR-PR02). It is **off by default** and turns on only when the build defines `VITE_PLAUSIBLE_DOMAIN`. All calls go through the `track()` helper of `@nerdose/ui` (ADR-014).

## When to use

- Only in `web`. The `admin` app loads no analytics.

## Package

```
@nerdose/ui     # exports track(event) and the script injector
```

## Configuration

```ts
// src/lib/env.ts (excerpt)
VITE_PLAUSIBLE_DOMAIN: z.string().optional(),
VITE_PLAUSIBLE_SCRIPT_URL: z.string().url().optional(),
// refinement: if DOMAIN is set, SCRIPT_URL is required, otherwise the build fails
```

- With `VITE_PLAUSIBLE_DOMAIN` empty: the script is **not** injected and `track()` is a no-op.
- With a value: the script is injected with `defer` and `data-domain`, from `VITE_PLAUSIBLE_SCRIPT_URL`.

## How to use

```ts
import { track } from '@nerdose/ui';

track(`share:${gameId}`);   // e.g. 'share:devdle'
```

- Share events are fired by the share button after `navigator.share` or the clipboard copy succeeds.
- Pageviews are collected by Plausible's script itself (SPA route changes included when the script supports it); the app does not send them manually.

## Rules

- Call only `track()` from `@nerdose/ui`. Never reference `window.plausible` outside that helper.
- The only custom event is `share:<game_id>`, with no custom properties.
- Never send personal data, `nd_pid`, results, scores or solutions to analytics.
- Do not add other analytics or tracking libraries.
- Analytics must never break the app: `track()` swallows its own errors.
- Do not load analytics in `admin`.
- Do not show a cookie banner; no cookies are set by analytics.

## Integration with other conventions

- **game-clients**: the share flow calls `track()`.
- **_base**: env variables are validated in `lib/env.ts`.
