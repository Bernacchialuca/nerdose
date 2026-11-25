---
id: accessibility
display_name: Accesibilidad (WCAG 2.1 AA)
language: react
description: "Mobile-first, keyboard-complete, non-color-dependent UI that meets WCAG 2.1 AA"
applies_to: [frontend]
required_by: []
package: axe-core
---

# Accessibility (React, WCAG 2.1 AA)

The apps target **WCAG 2.1 AA**. These rules make the product usable from 320 px, fully playable and operable with the keyboard, and readable without relying on color (NFR-U01 to NFR-U04). They apply to every screen and every game.

## When to use

- Every component, screen and game in `web` and `admin`.
- Reviewing any change that adds an interactive element, a color or an animation.

## Package

```
axe-core / vitest-axe          # component checks (testing-unit)
# @axe-core/playwright: not installed; only for one-off page audits (see testing-e2e, debt D3)
eslint-plugin-jsx-a11y         # lint-time checks
```

## How to use

### Structure and semantics

- One `<main>` per page, landmarks for header/nav/footer, one `<h1>` per screen, headings in order.
- Use native elements first: `<button>`, `<a>`, `<input>`, `<label>`, `<table>`. Use ARIA only when no native element fits.
- Every input has a visible `<label>` or an `aria-label`; errors are tied with `aria-describedby`.

### Keyboard

- Everything operable with the mouse is operable with the keyboard, in a logical tab order, with no keyboard traps.
- Timeline's drag and drop uses dnd-kit with **both** `TouchSensor` and `KeyboardSensor`, and announces moves through live regions.
- Provide a visible focus ring on every focusable element (`focus-visible`).

### Not only color

- Feedback that uses color (Devdle marks, Timeline correct/wrong, win/loss) is also expressed with an icon, a pattern or text, and exposed to screen readers as text.

### Dynamic messages

- Result, errors and notices appear in `role="status"` (polite) or `role="alert"` (errors) regions.
- On navigation, move focus to the new page heading and update `document.title`.

### Motion and sizes

- Honor `prefers-reduced-motion`.
- Touch targets are at least 44 x 44 px. Layout reflows at 320 px without horizontal scroll and supports 200% text zoom.

## Rules

- Contrast is at least 4.5:1 for text (3:1 for large text and UI boundaries) against its actual background.
- No interactive element is built from a `<div>` or `<span>` with a click handler; use a native control.
- Every image or icon is either decorative (`aria-hidden`) or has an accessible name.
- Color is never the only carrier of meaning.
- Each of the 5 games can be completed with the keyboard alone (NFR-U03).
- Focus is never removed (`outline: none`) without a visible replacement.
- Modal and overlay UI traps focus while open, closes with `Escape` and returns focus to the trigger.
- Dynamic updates are announced via live regions; do not move focus unexpectedly.
- axe-core reports zero violations in unit checks and in page audits (one-off while e2e is not adopted, see testing-e2e).
- Language is declared (`<html lang>`) and updated when the locale changes.

## Integration with other conventions

- **styling**: tokens, contrast, focus rings, touch targets and responsive rules.
- **testing-unit** and **testing-e2e**: axe-core checks and keyboard-only specs enforce these rules.
- **game-clients**: every game client must meet these rules.
