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

The admin reuses the `client` package of every game (ADR-006) to **preview upcoming challenges with their solution**. It mounts each game's `Preview` component, fed with the full `payload` returned by `/api/admin/*`, in Spanish and English side by side. A registry maps `game_id` to the lazy `client` entry; the admin has no game-specific logic.

## When to use

- The `upcoming` module (next 14 days: challenge detail drawer with preview and regenerate).
- Any place where the admin shows a challenge as the player would see it, with its solution.

## Structure

```
src/modules/upcoming/
├── registry.ts                       # game_id -> lazy import of the client entry; hasPreview(), previewComponent()
└── components/
    ├── challenge-preview.tsx         # renders Preview in two panels (es, en), or the generic fallback
    └── preview-error-boundary.tsx    # if a Preview throws, shows a warning Banner + the generic payload view
```

The generic fallback is `PayloadBilingual`, exported by the `reports` module (`@/modules/reports`).

## Configuration

```ts
// src/modules/upcoming/registry.ts
export type PreviewProps = { payload: unknown; language: Locale };
type PreviewClient = { Preview: ComponentType<PreviewProps> };   // structural copy of the ./client contract

const clientRegistry: Partial<Record<GameId, () => Promise<PreviewClient>>> = {
  'big-o': () => import('@nerdose/game-big-o/client'),
  devdle: () => import('@nerdose/game-devdle/client'),
  'grep-grid': () => import('@nerdose/game-grep-grid/client'),
  timeline: () => import('@nerdose/game-timeline/client'),
};

export const hasPreview = (id: GameId): boolean => clientRegistry[id] !== undefined;
export function previewComponent(id: GameId) { /* React.lazy over the entry, cached per game_id */ }
```

- The registry is `Partial`: it lists only games whose package exports `Preview`. A game is added here when its package ships `Preview`.
- `previewComponent` caches the `lazy()` component per `game_id`, so reopening a drawer does not recreate it.
- `Preview` props are owned by the game packages (ADR-006); the admin passes the payload through without reinterpreting it.

## How to use

### Side-by-side preview

```tsx
export function ChallengePreview({ gameId, payload }: ChallengePreviewProps) {
  if (!hasPreview(gameId)) return <PayloadBilingual payload={payload} />;
  const LazyPreview = previewComponent(gameId);
  return (
    <PreviewErrorBoundary payload={payload}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(['es', 'en'] as const).map((language) => (
          <Panel key={language} title={language.toUpperCase()} titleLevel={3}>
            <Suspense fallback={<p role="status">Cargando preview…</p>}>
              <LazyPreview payload={payload} language={language} />
            </Suspense>
          </Panel>
        ))}
      </div>
    </PreviewErrorBoundary>
  );
}
```

- The two panels stack on narrow screens and sit side by side from `lg` up (the drawer is narrower than the page).
- Each `Preview` translates its own texts with the game package's i18n resources according to `language`, and sets `lang` on its root. The admin does **not** initialize i18next nor wrap previews in `I18nextProvider`; the admin UI is plain Spanish.
- Give the drawer's preview a `key={challenge.id}` so a regenerated challenge remounts it (and resets the error boundary).
- The preview is read-only: it never sends moves, starts plays or calls player endpoints.
- Big O's `Preview` renders the code as plain text and never triggers loading the syntax highlighter in the admin (checked by a build guard in `src/styles.test.ts`).

### Fallbacks

- No `Preview` for the game (Bug Hunt until it ships one) -> `PayloadBilingual`.
- `Preview` throws (e.g. payload does not match the game's schema) -> `PreviewErrorBoundary` logs the error and shows a warning `Banner` plus `PayloadBilingual`, so the drawer stays usable (regenerate still works).

## Rules

- Import only `@nerdose/game-<game_id>/client`; never `./definition`, `./generator` or `@nerdose/polyglot`.
- The registry is the only place that lists games; no `if`/`switch` by `game_id` in `apps/admin`.
- Each game is a dynamic `import()` loaded only when its preview opens.
- Previews always show Spanish and English together; a challenge is not reviewable with one language only.
- Previews never send requests to player endpoints (`/api/games/*`, `/api/session`); they render from the admin payload.
- A failing preview must never break the drawer: always wrap it in `PreviewErrorBoundary` with the generic payload fallback.
- Heavy dependencies (Shiki, dnd-kit) stay inside the game packages and load lazily.
- The preview must meet the same accessibility rules as the player UI.

## Integration with other conventions

- **data-fetching**: the payload comes from `GET /api/admin/challenges/upcoming` via TanStack Query, with polling every 5 s while a regeneration is pending.
- **routing**: the `upcoming` route lazy-loads the previews.
- **styling**: panels use `Panel` from `@nerdose/ui` and the admin design tokens.
- **accessibility**: each panel has a level-3 title (`ES`/`EN`) and each `Preview` declares its `lang`.
