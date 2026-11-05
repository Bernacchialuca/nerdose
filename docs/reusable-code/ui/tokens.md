# Tokens

## tokens.css
- **Location:** packages/ui/src/tokens.css (exported as `@nerdose/ui/tokens.css`)
- **Description:** Single `@theme` block: `--font-mono`, surfaces, borders, text, `--color-accent`, per-game accents, `--color-warning` (`#FFB547`, DS `color.warning`). Dark only. Also declares `@source "./components";` so each app's Tailwind generates the classes used by ui components.
- **Usage:** `@import '@nerdose/ui/tokens.css';` in each app's `src/index.css`, then use `bg-bg`, `text-accent`, `text-game-bug-hunt`.
