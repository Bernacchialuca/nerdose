# Reusable Code Index - ui

Package `@nerdose/ui` (`packages/ui`), consumed by `web` and `admin`.

## Utils (1 item) - see utils.md
- **cn** (packages/ui/src/cn.ts) - Conditional class merge with a `tailwind-merge` instance extended with the theme's text, radius and shadow roles

## Helpers (3 items) - see helpers.md
- **buttonClass** (packages/ui/src/components/button-class.ts) - Class string for `primary` / `secondary` / `accent` buttons, `lg` / `md`, full width and disabled
- **linkClass** (packages/ui/src/components/link-class.ts) - Class string for arrow and subtle links, brand or per-game tone, 44px target
- **navItemClass** (packages/ui/src/components/nav-item-class.ts) - Class string for the header nav item, active / inactive

## Components (14 items) - see components.md
- **Alert** (packages/ui/src/components/alert.tsx) - Error notice (`role="alert"`) with icon, optional title, detail and action slot
- **AppHeader** (packages/ui/src/components/app-header.tsx) - `<header>` with brand, nav and actions slots; `home` variant with translucent background
- **Badge** (packages/ui/src/components/badge.tsx) - Status badge (`success` / `pending` / `neutral`) and "coming soon" chip
- **Banner** (packages/ui/src/components/banner.tsx) - Persistent warning notice (`role="status"`) aligned to the page container
- **BrandMark** (packages/ui/src/components/brand-mark.tsx) - `> nerdose_` logo with optional blinking cursor
- **Card** (packages/ui/src/components/card.tsx) - `game` (+ `next`, `thumbnail`), `placeholder`, `step` and `mini-stat` variants
- **GameThumbnail** (packages/ui/src/components/game-thumbnail.tsx) - Decorative 150px card header content for the five games
- **Panel** (packages/ui/src/components/panel.tsx) - `<section>` with `// label`, optional datum, title and note; `default` and `feature`
- **ProgressBar** (packages/ui/src/components/progress-bar.tsx) - Segmented `role="progressbar"`
- **SegmentedControl** (packages/ui/src/components/segmented-control.tsx) - Button group with `aria-pressed` (ES / EN selector)
- **StreakNumber** (packages/ui/src/components/streak-number.tsx) - Compact 88px streak number with unit; gray for 0 / no data
- **StreakPill** (packages/ui/src/components/streak-pill.tsx) - Amber streak pill; link armed by the app through `render`
- **TerminalWindow** (packages/ui/src/components/terminal-window.tsx) - Terminal window with status rows, streak summary and countdown

## Tokens (1 item) - see tokens.md
- **tokens.css** (packages/ui/src/tokens.css) - Tailwind v4 `@theme` with the DS 1.2.0 tokens plus the `texture-dots` utility
