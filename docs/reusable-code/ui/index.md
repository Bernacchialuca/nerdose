# Reusable Code Index - ui

Package `@nerdose/ui` (`packages/ui`), consumed by `web` and `admin`.

## Utils (3 items) - see utils.md
- **cn** (packages/ui/src/cn.ts) - Conditional class merge with a `tailwind-merge` instance extended with the theme's text, radius and shadow roles
- **injectAnalytics** (packages/ui/src/analytics.ts) - Injects the Plausible script only when a domain and script URL are given; idempotent
- **track** (packages/ui/src/analytics.ts) - Sends `share:<game_id>` without properties; no-op when analytics is off, never throws

## Helpers (4 items) - see helpers.md
- **buttonClass** (packages/ui/src/components/button-class.ts) - Class string for `primary` / `secondary` / `accent` / `error` / `icon` buttons, `lg` / `md` / `share`, full width and disabled
- **dataTableClass** (packages/ui/src/components/data-table-class.ts) - Class strings for the DS data-table: scroll region, table, header and body cells
- **linkClass** (packages/ui/src/components/link-class.ts) - Class string for arrow and subtle links, brand or per-game tone, 44px target
- **navItemClass** (packages/ui/src/components/nav-item-class.ts) - Class string for the header nav item, active / inactive

## Components (23 items) - see components.md
- **Alert** (packages/ui/src/components/alert.tsx) - Error notice (`role="alert"`) with icon, optional title, detail and action slot
- **AppHeader** (packages/ui/src/components/app-header.tsx) - `<header>` with brand, nav and actions slots; `home` variant with translucent background
- **Badge** (packages/ui/src/components/badge.tsx) - Status badge (`success` / `pending` / `neutral`) and chip (`loose` for "coming soon")
- **Banner** (packages/ui/src/components/banner.tsx) - Notice with `warning` / `success` / `failure` / `neutral` variants, optional `h1` title and action slot
- **BrandMark** (packages/ui/src/components/brand-mark.tsx) - `> nerdose_` logo with optional blinking cursor
- **Card** (packages/ui/src/components/card.tsx) - `game` (+ `next`, `thumbnail`), `placeholder`, `step` and `mini-stat` variants
- **ChartIcon** (packages/ui/src/components/icons.tsx) - 18px Lucide stats chart icon, `aria-hidden`
- **Dialog** (packages/ui/src/components/dialog.tsx) - Modal, right drawer or `sheet` (bottom-sheet on mobile, modal from `sm`) with focus trap, Escape / overlay close, focus return, `closeDisabled`, `describedBy` and inert background; text comes by props
- **GameHeader** (packages/ui/src/components/game-header.tsx) - Game screen header: `> nerdose / {game}` breadcrumb `<nav>`, `#number` meta and actions slot
- **GameThumbnail** (packages/ui/src/components/game-thumbnail.tsx) - Decorative 150px card header content for the five games
- **HelpIcon** (packages/ui/src/components/icons.tsx) - 18px Lucide `circle-help` icon, `aria-hidden`
- **Panel** (packages/ui/src/components/panel.tsx) - `<section>` with `// label`, optional datum, title and note; `default` and `feature`
- **ProgressBar** (packages/ui/src/components/progress-bar.tsx) - Segmented `role="progressbar"`
- **SegmentedControl** (packages/ui/src/components/segmented-control.tsx) - Button group with `aria-pressed` (ES / EN selector)
- **SelectField** (packages/ui/src/components/form-field.tsx) - Native select with label, optional hint and linked error
- **ShareIcon** (packages/ui/src/components/icons.tsx) - 16px Lucide `share` icon, `aria-hidden`
- **StreakNumber** (packages/ui/src/components/streak-number.tsx) - Compact 88px streak number with unit; gray for 0 / no data
- **StreakPill** (packages/ui/src/components/streak-pill.tsx) - Amber streak pill; link armed by the app through `render`
- **Tabs** (packages/ui/src/components/tabs.tsx) - Tablist with roving tabindex, arrow / Home / End keys and linked tabpanel
- **TerminalWindow** (packages/ui/src/components/terminal-window.tsx) - Terminal window with status rows, streak summary and countdown
- **TextAreaField** (packages/ui/src/components/form-field.tsx) - Native textarea (4 rows) with label, optional hint and linked error
- **TextField** (packages/ui/src/components/form-field.tsx) - Native input with label, optional hint, linked error and `aria-required` via `required`

## Tokens (1 item) - see tokens.md
- **tokens.css** (packages/ui/src/tokens.css) - Tailwind v4 `@theme` with the DS 1.7.0 tokens plus the `texture-dots` utility
