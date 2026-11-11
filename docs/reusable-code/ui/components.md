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
- **Description:** Status badge (`success`, `pending`, `neutral`, optional `strong`) or the outline `chip` (`px-2.5`; `loose` gives `px-3` for "coming soon"). Non-interactive `<span>`.
- **Signature:** `Badge({ variant?: 'badge' | 'chip'; tone?: 'success' | 'pending' | 'neutral'; strong?: boolean; loose?: boolean; children: ReactNode; className?: string })`
- **Usage:** `<Badge tone="success">✓ 4/6</Badge>` · `<Badge variant="chip" loose>{t('home.soon')}</Badge>`

## Banner
- **Location:** packages/ui/src/components/banner.tsx
- **Description:** Tinted notice with `warning` (default), `success`, `failure` and `neutral` variants: 40px status icon (none in `neutral`), mono title (`titleAs` `p`/`h1`/`h2`) and detail, optional `action` slot. `role="status"` unless `announce` is false (default false only for `neutral`).
- **Signature:** `Banner({ variant?: 'warning' | 'success' | 'failure' | 'neutral'; title?: ReactNode; titleAs?: 'p' | 'h1' | 'h2'; children?: ReactNode; action?: ReactNode; announce?: boolean; className?: string })`
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

## Dialog
- **Location:** packages/ui/src/components/dialog.tsx
- **Description:** Modal (centered, `z-50`), sheet (bottom-anchored with rounded top corners on mobile, same as modal from `sm`, `z-50`) or drawer (right-anchored, `max-w-5xl`, `z-40`) with `role="dialog"` / `"alertdialog"`, `aria-modal`, focus trap, Escape and overlay close, focus return to the trigger. While mounted, everything outside the dialog gets `inert` (restored before focus returns). `describedBy` sets `aria-describedby` on the panel (omitted without it). `closeDisabled` blocks every close path. No own text: `closeLabel` is the accessible name of the close button.
- **Signature:** `Dialog(props: DialogProps)` where `DialogProps = { variant: 'modal' | 'drawer' | 'sheet'; title: ReactNode; closeLabel: string; onClose: () => void; closeDisabled?: boolean; role?: 'dialog' | 'alertdialog'; initialFocusRef?: RefObject<HTMLElement | null>; titleRef?: RefObject<HTMLHeadingElement | null>; describedBy?: string; children: ReactNode }`
- **Usage:** `<Dialog variant="modal" title="Anular desafío" closeLabel="Cerrar" onClose={close} closeDisabled={pending} initialFocusRef={reasonRef}>...</Dialog>`; `<Dialog variant="sheet" title={t('report.title')} closeLabel={t('close')} describedBy={noticeId} onClose={close}>...</Dialog>`

## GameHeader
- **Location:** packages/ui/src/components/game-header.tsx
- **Description:** Header of game screens: `<nav aria-label>` + `<ol>` breadcrumb `> nerdose / {game}` (crumb in the game accent via `GAME_CLASSES`, `aria-current="page"`), optional `#number` meta and an actions slot (`children`). The home link is built by the app through `renderHome`. No per-game conditionals.
- **Signature:** `GameHeader({ game: UiGameId; navLabel: string; homeLabel: ReactNode; renderHome: (props: { className: string; children: ReactNode }) => ReactElement; crumb: ReactNode; meta?: ReactNode; children?: ReactNode; className?: string })`
- **Usage:** `<GameHeader game="devdle" navLabel={t('nav')} homeLabel="nerdose" renderHome={(p) => <Link to="/" {...p} />} crumb="devdle" meta="#8">{actions}</GameHeader>`

## HelpIcon / ChartIcon / ShareIcon
- **Location:** packages/ui/src/components/icons.tsx
- **Description:** Lucide icons for the game header actions: `HelpIcon` (`circle-help`, 18px), `ChartIcon` (stats bars, 18px) and `ShareIcon` (`share`, 16px). `aria-hidden`, `currentColor`.
- **Signature:** `HelpIcon({ className?: string })` (same for `ChartIcon`, `ShareIcon`); `IconProps = { className?: string }`
- **Usage:** `<button aria-label={t('stats')} className={buttonClass({ variant: 'icon' })}><ChartIcon /></button>`

## TextField / TextAreaField / SelectField
- **Location:** packages/ui/src/components/form-field.tsx
- **Description:** Native input, textarea (4 rows by default) and select with a visible `<label>`, optional `hint` (helper or counter) and `error`. `aria-describedby` lists hint then error; `aria-invalid` with `error`; `aria-required` only with `required` (not the HTML attribute, so forms use `noValidate`).
- **Signature:** `TextField(props: TextFieldProps)`, `TextAreaField(props: TextAreaFieldProps)`, `SelectField(props: SelectFieldProps)`; native props (minus `id`, `className`, `required`) plus `{ label: ReactNode; error?: string; hint?: ReactNode; required?: boolean }` and `inputRef` / `textareaRef` / `selectRef`
- **Usage:** `<TextAreaField label={t('report.message')} hint={`${message.length} / 1000`} maxLength={1000} value={message} onChange={...} />`

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

## Tabs
- **Location:** packages/ui/src/components/tabs.tsx
- **Description:** `role="tablist"` with roving tabindex, automatic activation by click, ArrowLeft / ArrowRight (circular), Home and End; each tab styled with `navItemClass`; children render in the linked `tabpanel`.
- **Signature:** `Tabs<T extends string>(props: TabsProps<T>)` where `TabsProps<T> = { label: string; tabs: readonly TabItem<T>[]; value: T; onChange: (value: T) => void; children: ReactNode }` and `TabItem<T> = { value: T; label: string }`
- **Usage:** `<Tabs label="Estado" tabs={STATUS_TABS} value={status} onChange={setStatus}>...</Tabs>`

## TerminalWindow
- **Location:** packages/ui/src/components/terminal-window.tsx
- **Description:** Terminal window (`<section aria-label>`) with a decorative title bar, command line, a list of rows (states `done`, `pending`, `in-progress`, `no-challenge`, `voided`, `upcoming`, `unavailable`; icon plus text), optional streak summary (`tone: 'streak' | 'dim'`) and countdown with a `▌` cursor. No live regions: the app updates the countdown every second.
- **Signature:** `TerminalWindow({ label: string; title: ReactNode; command: ReactNode; rows: readonly TerminalRow[]; summary?: { label; value; tone }; countdown?: { label; value }; className?: string })`
- **Usage:** `<TerminalWindow label={t('terminal.label')} title="~/hoy — progreso.log" command="$ nerdose status" rows={rows} countdown={{ label: t('next'), value: '05:42:10' }} />`
