---
id: game-clients
display_name: UI de juegos (preview con solución)
language: react
description: "How the admin mounts each game's client package in solution mode for challenge previews"
applies_to: [frontend]
required_by: []
package: null
---

# Game Clients (React, admin preview)

The admin reuses the `client` package of every game (ADR-006) to **preview upcoming challenges with their solution**. It mounts the same React components as `web`, fed with the full `payload` returned by `/api/admin/*`, in Spanish and English side by side. A registry maps `game_id` to the lazy `client` entry; the admin has no game-specific logic.

## When to use

- The `upcoming` module (next 14 days: preview and regenerate).
- Any place where the admin shows a challenge as the player would see it, with its solution.

## Structure

```
src/modules/upcoming/
├── registry.ts              # game_id -> lazy import of the client entry
├── challenge-preview.tsx    # renders the client in solution mode, es and en
└── preview-i18n.ts          # fixed-language i18next instances (es, en) for the clients' UI texts
```

## Configuration

```ts
// src/modules/upcoming/registry.ts
export const clientRegistry = {
  'devdle': () => import('@nerdose/game-devdle/client'),
  'grep-grid': () => import('@nerdose/game-grep-grid/client'),
  'timeline': () => import('@nerdose/game-timeline/client'),
  'big-o': () => import('@nerdose/game-big-o/client'),
  'bug-hunt': () => import('@nerdose/game-bug-hunt/client'),
} satisfies Record<GameId, () => Promise<GameClient>>;
```

`GameClient` is the `./client` entry shape defined by the game contract (`Instructions`, `Game`, `Result`, `share`, and `Preview` with props `{ payload, language }`, read-only, REQ-008). The admin mounts `Preview` in two panels (`es`, `en`) with the fixed i18next instances; a game without `Preview` falls back to `PayloadView`. Props are owned by the game packages and `@nerdose/core`; the admin passes the payload through without reinterpreting it.

## How to use

### Side-by-side preview

```tsx
<div className="grid gap-4 md:grid-cols-2">
  {(['es', 'en'] as const).map((lng) => (
    <I18nextProvider key={lng} i18n={previewI18n[lng]}>
      <section lang={lng} aria-label={lng === 'es' ? 'Español' : 'English'}>
        <Suspense fallback={<p role="status">Cargando…</p>}>
          <ChallengePreview gameId={gameId} payload={payload} language={lng} mode="solution" />
        </Suspense>
      </section>
    </I18nextProvider>
  ))}
</div>
```

- On narrow screens the two panels stack; at `md` and above they sit side by side.
- The `payload` carries `{ es, en }` for every text; each panel selects its language, so a missing translation is visible at a glance.
- The preview is read-only: it never sends moves, starts plays or calls player endpoints.

### Why i18next exists in the admin

- The admin's own UI is plain Spanish. i18next is initialized only so game clients (which translate their UI strings with react-i18next) can render in each panel's language through two fixed instances. App code does not use `t()`.

## Rules

- Import only `@nerdose/game-<game_id>/client`; never `./definition`, `./generator` or `@nerdose/polyglot`.
- The registry is the only place that lists games; no `if`/`switch` by `game_id` in `apps/admin`.
- Each game is a dynamic `import()` loaded only when its preview opens.
- Previews always show Spanish and English together; a challenge is not reviewable with one language only.
- Previews never send requests to player endpoints (`/api/games/*`, `/api/session`); they render from the admin payload.
- Heavy dependencies (Shiki, dnd-kit) stay inside the game packages and load lazily.
- The preview must meet the same accessibility rules as the player UI.

## Integration with other conventions

- **data-fetching**: the payload comes from `GET /api/admin/challenges/upcoming` via TanStack Query, with polling while a regeneration is pending.
- **routing**: the `upcoming` route lazy-loads the previews.
- **accessibility**: each panel declares its `lang` and a label.
