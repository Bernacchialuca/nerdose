# Components

Components hold no visible text of their own (ADR-002): all text comes in through props, resolved by the app with `t()`. Glyphs (`>`, `_`, `//`, `▌`, terminal row icons) are the documented exception. All markup avoids responsive prefixes and arbitrary values; they are fluid (`flex-wrap`, `min-w-0`) down to 256px.

## Alert
- **Location:** packages/ui/src/components/alert.tsx
- **Description:** Error notice (`role="alert"`): tinted panel, 40px `x` icon, optional mono title, Inter detail and an `action` slot (e.g. retry). Does not move focus.
- **Signature:** `Alert({ title?: ReactNode; children?: ReactNode; action?: ReactNode; className?: string })`
- **Usage:** `<Alert title={t('home.errorTitle')} action={<button type="button" className={buttonClass({ variant: 'secondary' })}>{t('home.retry')}</button>}>{t('home.errorDetail')}</Alert>`

## AppHeader
- **Location:** packages/ui/src/components/app-header.tsx
- **Description:** `<header>` landmark, wraps (`flex-wrap`), bottom border; `home` variant adds the translucent background. Order: `brand`, `nav` (the app builds its own `<nav>`), actions (`children`).
- **Signature:** `AppHeader({ brand: ReactNode; nav?: ReactNode; children?: ReactNode; variant?: 'default' | 'home'; className?: string })`
- **Usage:** `<AppHeader variant="home" brand={<Link to="/"><BrandMark label="nerdose" cursor="blink" /></Link>} nav={<nav aria-label={t('nav.label')}>…</nav>}><SegmentedControl … /></AppHeader>`

## Badge
- **Location:** packages/ui/src/components/badge.tsx
- **Description:** Status badge (`success`, `pending`, `neutral`, optional `strong`) or the "coming soon" `chip` (outline, no background). Non-interactive `<span>`.
- **Signature:** `Badge({ variant?: 'badge' | 'chip'; tone?: 'success' | 'pending' | 'neutral'; strong?: boolean; children: ReactNode; className?: string })`
- **Usage:** `<Badge tone="success">✓ 4/6</Badge>` · `<Badge variant="chip">{t('home.soon')}</Badge>`

## Banner
- **Location:** packages/ui/src/components/banner.tsx
- **Description:** Persistent `role="status"` warning (`warning` variant): tinted panel with a 40px `!` icon, mono title and Inter detail. No action; aligned to the page container by the app.
- **Signature:** `Banner({ title: ReactNode; children?: ReactNode; variant?: 'warning'; className?: string })`
- **Usage:** `<Banner title={t('cookies.title')}>{t('cookies.detail')}</Banner>`

## BrandMark
- **Location:** packages/ui/src/components/brand-mark.tsx
- **Description:** `> nerdose_` logo: `>` and `_` in the accent (both `aria-hidden`), label in primary text, Mono 800. `cursor="blink"` blinks the `_` 4 times, only under `prefers-reduced-motion: no-preference`.
- **Signature:** `BrandMark({ label: ReactNode; cursor?: 'static' | 'blink'; className?: string })`
- **Usage:** `<Link to="/"><BrandMark label="nerdose" cursor="blink" /></Link>`

## Card
- **Location:** packages/ui/src/components/card.tsx
- **Description:** `game` (default; `<article>`, optional 150px `thumbnail` header tinted by `game`, `next` adds the game's border and shadow), `placeholder` (dashed, no background), `step` (kicker with `tone`) and `mini-stat` (`<div>`, value + label). Not interactive; passes `<article>` props and merges `className`.
- **Signature:** `Card(props: CardProps)` (discriminated by `variant`; see `CardProps`)
- **Usage:** `<Card game="bug-hunt" next thumbnail={<GameThumbnail game="bug-hunt" />} aria-labelledby="g-bh">…</Card>`

## GameThumbnail
- **Location:** packages/ui/src/components/game-thumbnail.tsx
- **Description:** Decorative (`aria-hidden`) content of the card header for `devdle`, `bug-hunt`, `big-o`, `timeline` and `grep-grid`. The tinted container comes from `Card` via `thumbnail`.
- **Signature:** `GameThumbnail({ game: UiGameId; className?: string })`
- **Usage:** `<Card game="devdle" thumbnail={<GameThumbnail game="devdle" />}>…</Card>`

## Panel
- **Location:** packages/ui/src/components/panel.tsx
- **Description:** `<section aria-labelledby>` with a `// label` (the `//` is `aria-hidden`), optional amber `datum`, `h2`/`h3` title and Inter `note`. Variants `default` (radius 14) and `feature` (radius 16, padding 28).
- **Signature:** `Panel({ variant?: 'default' | 'feature'; label?: ReactNode; datum?: ReactNode; title?: ReactNode; titleLevel?: 2 | 3; note?: ReactNode; …sectionProps })`
- **Usage:** `<Panel variant="feature" label={t('progress.label')} title={t('progress.title')}>…</Panel>`

## ProgressBar
- **Location:** packages/ui/src/components/progress-bar.tsx
- **Description:** Segmented `role="progressbar"` (36×6 segments); `value` is clamped to `0..total`; `label` is the accessible name.
- **Signature:** `ProgressBar({ variant?: 'segmented'; value: number; total: number; label: string; className?: string })`
- **Usage:** `<ProgressBar value={2} total={5} label={t('home.progressLabel', { done: 2, total: 5 })} />`

## SegmentedControl
- **Location:** packages/ui/src/components/segmented-control.tsx
- **Description:** `role="group"` of native `<button aria-pressed>` segments with per-option `lang`, a bottom indicator on the active one and a 44×44 touch area. `disabled` disables all segments.
- **Signature:** `SegmentedControl<T extends string>({ label: string; options: readonly SegmentedOption<T>[]; value: T; onChange: (value: T) => void; disabled?: boolean; className?: string })`
- **Usage:** `<SegmentedControl label={t('language.label')} value={locale} options={[{ value: 'es', label: 'ES', lang: 'es' }, { value: 'en', label: 'EN', lang: 'en' }]} onChange={changeLocale} />`

## StreakNumber
- **Location:** packages/ui/src/components/streak-number.tsx
- **Description:** Compact streak number (88px, Mono 800) with a `unit` slot, read together as one paragraph. Amber when `value > 0`; gray for `0`; `—` for `null`.
- **Signature:** `StreakNumber({ variant?: 'compact'; value: number | null; unit: ReactNode; className?: string })`
- **Usage:** `<StreakNumber value={4} unit={<>{t('days')}<br />{t('inARow')}</>} />`

## StreakPill
- **Location:** packages/ui/src/components/streak-pill.tsx
- **Description:** Amber pill with a flame icon. With `render` the app builds the link (`<a>` / `<Link>`) and gets 44px height, focus and hover; without it, a `<span>`. `value` 0 or `null` renders the neutral gray pill.
- **Signature:** `StreakPill({ value: number | null; children: ReactNode; className?: string; render?: (props: { className: string; children: ReactNode }) => ReactElement })`
- **Usage:** `<StreakPill value={4} render={(p) => <Link to="/stats" aria-label={t('streak.aria', { n: 4 })} {...p} />}>{t('streak.days', { n: 4 })}</StreakPill>`

## TerminalWindow
- **Location:** packages/ui/src/components/terminal-window.tsx
- **Description:** Terminal window (`<section aria-label>`) with a decorative title bar, command line, a list of rows (states `done`, `pending`, `in-progress`, `no-challenge`, `voided`, `upcoming`, `unavailable`; icon plus text), optional streak summary (`tone: 'streak' | 'dim'`) and countdown with a `▌` cursor. No live regions: the app updates the countdown every second.
- **Signature:** `TerminalWindow({ label: string; title: ReactNode; command: ReactNode; rows: readonly TerminalRow[]; summary?: { label; value; tone }; countdown?: { label; value }; className?: string })`
- **Usage:** `<TerminalWindow label={t('terminal.label')} title="~/hoy — progreso.log" command="$ nerdose status" rows={rows} countdown={{ label: t('next'), value: '05:42:10' }} />`
