# Helpers

Class-string helpers: they only return classes, so `web` applies them to `<button>` and to React Router `<Link>` without `ui` importing the router. Every class is a full literal under `src/components/` so Tailwind generates it.

## buttonClass
- **Location:** packages/ui/src/components/button-class.ts
- **Description:** DS button: radius 10, Mono, `lg` (48px) / `md` (44px) / `share` (44px high, `px-3.5`), `primary` (brand), `secondary` (outline), `accent` (per-game, requires `game`) and `error` (destructive fill: `bg-status-error`, hover Pending in the DS) and `icon` (44x44 icon-only; the consumer must set `aria-label`). Disabled is neutral with no hover, except the Bug Hunt `accent`, which uses `game.bug-hunt.disabled.*` (`GAME_CLASSES[game].disabled`); the consumer sets `aria-disabled="true"` and blocks the action so the control stays focusable.
- **Signature:** `buttonClass(options?: ButtonClassOptions): string` where `ButtonClassOptions = { size?: 'lg' | 'md' | 'share'; fullWidth?: boolean; disabled?: boolean } & ({ variant?: 'primary' | 'secondary' | 'error' } | { variant: 'accent'; game: UiGameId }) | { variant: 'icon'; disabled?: boolean }`
- **Usage:** `<Link to="/play" className={buttonClass({ variant: 'accent', game: 'big-o', fullWidth: true })}>Jugar →</Link>` · `<button aria-label={t('help')} className={buttonClass({ variant: 'icon' })}><HelpIcon /></button>`

## linkClass
- **Location:** packages/ui/src/components/link-class.ts
- **Description:** DS link: Mono, no underline, `min-height` 44px, hover to the light tone. Tones: `brand` (default), `subtle`, or a game id.
- **Signature:** `linkClass(options?: { tone?: LinkTone }): string`
- **Usage:** `<Link to="/stats" className={linkClass()}>ver estadísticas →</Link>`

## navItemClass
- **Location:** packages/ui/src/components/nav-item-class.ts
- **Description:** Header nav item: radius 8, 44px high, active uses `bg-nav-active text-text` (never green). `aria-current="page"` comes from `NavLink`.
- **Signature:** `navItemClass(options: { active: boolean }): string`
- **Usage:** `<NavLink to="/" className={({ isActive }) => navItemClass({ active: isActive })}>./juegos</NavLink>`

## dataTableClass
- **Location:** packages/ui/src/components/data-table-class.ts
- **Description:** DS data-table classes: scrollable bordered region (focus ring), full-width table (`min-w-160`), header cell (`border-subtle`, label type) and body cell (`border-row`). Only classes: the consumer builds `<table>`, `<caption>`, `<th scope="col">` and gives the region `tabIndex={0}` plus an accessible name.
- **Signature:** `dataTableClass(): DataTableClasses` where `DataTableClasses = { region: string; table: string; th: string; td: string }`
- **Usage:** `const c = dataTableClass(); <div role="region" tabIndex={0} aria-label="..." className={c.region}><table className={c.table}><caption className="sr-only">...</caption>...</table></div>`
