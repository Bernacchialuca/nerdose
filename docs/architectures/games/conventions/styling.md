---
id: styling
display_name: Estilos (Tailwind CSS v4)
language: react
description: "Tailwind CSS v4 with the prototype's visual tokens declared in @theme and owned by @nerdose/ui"
applies_to: [frontend, library]
required_by: []
package: tailwindcss
---

# Styling (React, Tailwind CSS v4)

Styling uses **Tailwind CSS v4** with CSS-first configuration: the visual tokens live in an `@theme` block in `packages/ui`, shared by `web` and `admin`. The look is dark, terminal-like, JetBrains Mono, with `#3DDC84` as the brand accent and one accent per game (NFR-U07).

## When to use

- Every component in `web`, `admin` and `@nerdose/ui`.
- Not for dynamic values computed at runtime that cannot be expressed as classes (use a CSS variable set via `style`).

## Package

```
tailwindcss                  # v4
@tailwindcss/vite            # Vite plugin
@fontsource/jetbrains-mono   # self-hosted font (400, 500, 700)
clsx                         # conditional classes
tailwind-merge               # conflict-free class merging
```

## Setup

```ts
// vite.config.ts
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({ plugins: [react(), tailwindcss()] });
```

```css
/* src/index.css */
@import 'tailwindcss';
@import '@nerdose/ui/tokens.css';   /* the @theme block */
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/700.css';
```

## Design tokens

> **Source of truth.** The Design System of each surface (`docs/design-system/<surface>/`) takes precedence over the values below; for `web` it is v1.0.0+, extracted from the prototype `docs/nerdose.html`, which is the visual source of truth (NFR-U07). `@nerdose/ui/tokens.css` must be updated to match the DS. The values below are a historical snapshot and may be outdated.

```css
/* packages/ui/src/tokens.css */
@theme {
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;

  --color-bg: #0A0C0F;            /* page background */
  --color-surface: #0F1318;       /* cards */
  --color-surface-2: #11151A;     /* raised / inputs */
  --color-surface-3: #141920;
  --color-border: #222A33;
  --color-border-strong: #2A323C;
  --color-border-subtle: #1E252E;

  --color-text: #E6EDF3;          /* primary text */
  --color-text-muted: #9AA6B2;    /* secondary text */
  --color-text-dim: #8D99A6;      /* tertiary text, labels */

  --color-accent: #3DDC84;        /* brand accent, also Devdle */
  --color-on-accent: #06120B;     /* text on accent backgrounds */

  --color-game-devdle: #3DDC84;
  --color-game-bug-hunt: #FFB547;
  --color-game-big-o: #5EB1FF;
  --color-game-timeline: #C39BFF;
  --color-game-grep-grid: #F472B6;
}
```

- Tailwind then exposes them as `bg-bg`, `bg-surface`, `text-text`, `text-text-muted`, `border-border`, `text-accent`, `text-game-bug-hunt`, etc.
- The streak/warning amber is the Bug Hunt accent `#FFB547` in the prototype; it is referenced through the token, not repeated.
- Per-game accent is applied by the game's own `client` via its token, never with a literal hex.

## The `cn()` helper

```ts
// packages/ui/src/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
```

## Dark theme only

- The product is dark. There is no light theme and no theme switcher in v1. Tokens are defined once on `:root`; do not add `dark:` variants.

## Responsive design

- **Mobile-first from 320 px** (NFR-U01): base classes target the smallest screen; use `sm:`/`md:`/`lg:` to add layout for larger ones. No horizontal scroll at 320 px (WCAG reflow).
- Touch targets are at least 44 x 44 px.
- Do not hide essential functionality at small sizes.

## When NOT to use Tailwind classes

- Values from data or timers (progress width, countdown): set a CSS variable with `style={{ '--w': pct + '%' }}` and consume it in a class.
- Third-party rendered output (Shiki markup): style through a scoped CSS selector in the owning package.

## Class ordering

- Layout, spacing, typography, color, state variants (`hover:`, `focus-visible:`). Use the Prettier Tailwind plugin to enforce it.

## Rules

- Use only the tokens above (or later, the Design System's). No literal hex colors, no arbitrary `[#abc]` color values in components.
- Tokens live only in `packages/ui`; `web` and `admin` must not redeclare them.
- Font is JetBrains Mono via `@fontsource/jetbrains-mono`, self-hosted. No Google Fonts or other external font requests.
- Merge conditional classes with `cn()`; never concatenate class strings by hand.
- Text and interactive-element contrast meets WCAG 2.1 AA against the surface it sits on (4.5:1 text, 3:1 large text and UI components). Verify any new color pair.
- Focus is always visible: use `focus-visible:` rings with `--color-accent`; never `outline-none` without a replacement.
- State is never conveyed by color alone: pair it with an icon, text or pattern (see `accessibility`).
- Respect `prefers-reduced-motion`: animations are disabled or reduced under it.
- No CSS-in-JS and no component CSS files, except the token file and third-party overrides.

## Integration with other conventions

- **accessibility**: contrast, focus rings, touch targets and non-color feedback are checked there.
- **game-clients**: each game uses its accent token and shared components from `@nerdose/ui`.
- **testing-e2e**: viewport projects at 320 px and desktop validate the responsive rules.
