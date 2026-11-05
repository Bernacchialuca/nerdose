# Components

Components hold no visible text of their own (ADR-002): all text comes in through props, resolved by the app with `t()`.

## Banner
- **Location:** packages/ui/src/components/banner.tsx
- **Description:** Persistent, non-dismissible full-width notice. `role="status"` region with a warning title and optional caption-size detail.
- **Signature:** `Banner({ title: ReactNode; children?: ReactNode; className?: string })`
- **Usage:** `<Banner title={t('cookies.title')} className="sticky top-0">{t('cookies.detail')}</Banner>`

## BrandMark
- **Location:** packages/ui/src/components/brand-mark.tsx
- **Description:** `> nerdose` mark: decorative `aria-hidden` glyph plus accent-colored label. Not focusable; wrap it in a link in the app.
- **Signature:** `BrandMark({ label: ReactNode; className?: string })`
- **Usage:** `<Link to="/"><BrandMark label="nerdose" /></Link>`

## AppHeader
- **Location:** packages/ui/src/components/app-header.tsx
- **Description:** `<header>` landmark, mobile-first flex row that wraps; brand on the left, `children` (nav, language selector) on the right. Adds no `<nav>`.
- **Signature:** `AppHeader({ brand: ReactNode; children?: ReactNode; className?: string })`
- **Usage:** `<AppHeader brand={<BrandMark label="nerdose" />}><nav aria-label={t('nav.label')}>...</nav></AppHeader>`

## Card
- **Location:** packages/ui/src/components/card.tsx
- **Description:** Surface container (`<article>`, `bg-surface`, decorative `border-border`, `rounded-2xl`, `p-4`, flex column `gap-3`). No text, no game knowledge, not interactive; the consumer adds heading, accent and CTA.
- **Signature:** `Card(props: ComponentPropsWithoutRef<'article'>)`
- **Usage:** `<Card aria-labelledby="game-devdle" className="h-full"><h2 id="game-devdle" className="text-game-devdle">{t('games.devdle')}</h2></Card>`

## Alert
- **Location:** packages/ui/src/components/alert.tsx
- **Description:** Inline error notice (`role="alert"`, `border-l-4 border-error`, `bg-surface`), message plus optional `action` slot (e.g. retry button). Does not move focus.
- **Signature:** `Alert({ children: ReactNode; action?: ReactNode; className?: string })`
- **Usage:** `<Alert action={<button type="button" onClick={retry}>{t('home.retry')}</button>}>{t('home.error')}</Alert>`
