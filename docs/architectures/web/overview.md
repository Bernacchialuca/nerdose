# web — Overview

## Proposito
SPA de los jugadores de nerdose (`nerdose.dev`). Muestra el catálogo de juegos del día (home), las instrucciones, la partida y el resultado de cada juego, las estadísticas y rachas del jugador, la página "about", el share y el selector de idioma. Es mobile-first desde 320 px, accesible (WCAG 2.1 AA) y se juega completa con teclado. Nunca tiene la solución antes de que termine la partida: la `api` es la dueña de la verdad y valida cada jugada.

## Tipo de servicio
Frontend en React 19 + Vite (SPA, sin SSR), TypeScript estricto.

## Modulos / superficies
- **shell** — layout, header, banners, rutas y manejo global de errores. Sin lógica por juego.
- **catalog** — home (`/`): estado de hoy de los 5 juegos, racha global y cuenta regresiva al próximo día.
- **game-host** — `/:game_id`: carga con `React.lazy` el `client` del juego (`packages/games/<game_id>/client`) mediante un registry; instrucciones, partida, resultado y share.
- **stats** — `/stats`: estadísticas y rachas del jugador.
- **about** — `/about`: qué es nerdose y cómo funciona.
- **session** — sesión anónima (`POST /api/session`, cookie `nd_pid` gestionada por la `api`), preferencias (idioma, lenguaje de código preferido) y aviso de cookies bloqueadas.

## Stack y decisiones aplicadas
- React 19, Vite, React Router (`/`, `/:game_id`, `/stats`, `/about`), TanStack Query, Tailwind CSS v4 (tokens del prototipo en `@theme`), `@fontsource/inter` (prosa), `@fontsource/jetbrains-mono`, i18next + react-i18next (solo UI), dnd-kit (Timeline, con `TouchSensor` + `KeyboardSensor`), Shiki lazy solo en big-o y bug-hunt, Zod (`moveSchema` de cada juego), Web Share API con Clipboard como alternativa (ADR-002, ADR-006).
- Cliente HTTP de mismo origen (`/api/*`), JSON en `snake_case` sin transformar y errores por `error.code` (ADR-015). En desarrollo el proxy de Vite emula el mismo origen (`/api` -> api).
- Identidad anónima por cookie `nd_pid` `HttpOnly`: el front no la lee ni la escribe, solo llama a `POST /api/session` en cada carga (ADR-009).
- Analítica opcional con `track()` de `@nerdose/ui` detrás de `VITE_PLAUSIBLE_DOMAIN`, apagada por defecto (ADR-014).
- Contextos de React a nivel app: solo el de sesión/preferencias (locale) además del `QueryClientProvider`.
- Pruebas: Vitest + Testing Library (unit), Playwright (e2e) y axe-core (accesibilidad).

## Notas adicionales
- **Sin catálogo para `react`.** El catálogo del workflow (`.claude/conventions/`) solo trae `nextjs`, que asume App Router, Server Components y Server Actions que esta SPA no usa. Por decisión del proyecto `web` declara `language: react` y define **todas** sus convenciones, incluida `_base`, como custom en `docs/architectures/web/conventions/`. Así ninguna convención de Next.js entra por catálogo ni por `required_by`. Se usó el catálogo de Next.js solo como referencia de estructura de secciones.
- **Convenciones compartidas con `admin`.** `_base`, `data-fetching`, `styling`, `state-management`, `accessibility`, `testing-unit` y `testing-e2e` son idénticas en ambas carpetas; si se cambia una, hay que cambiar la otra. Difieren `routing`, `error-handling` y `game-clients` (y `auth` solo existe en admin; `i18n` y `analytics` solo en web).
- **Convenciones en inglés, documentos de servicio en español**, como pide el template de convenciones del workflow.
- **Design System.** Vive en `docs/design-system/web/` (v1.0.0+, extraído del prototipo `docs/nerdose.html`, que es la fuente de verdad visual según NFR-U07). Sus tokens mandan sobre los de la convención `styling`. Los valores actuales salen de `docs/nerdose.html`, que usa colores inline sin variables CSS; los nombres de rol de los tokens son una interpretación.
- **Contrato de props de los `client`.** ADR-006 define que cada `client` exporta `Instructions`, `Game`, `Result` y `share(result, number)`. Las props las fija el paquete del juego y `web` las declara estructuralmente en el tipo `GameClient` de `apps/web/src/modules/game-host/types.ts` (copia estructural del contrato de los `./client`; incluye `GameProps.feedback` y `ResultProps.publicView`, REQ-005). El registry es parcial (`Partial<Record<GameId, () => Promise<GameClient>>>`): un juego sin client muestra «sin desafío hoy» sin llamar a la `api`.
- **Deuda de e2e (D3).** Playwright (`testing-e2e`) no está instalado: las stories de juego (S-013, S-021, S-024) cubren los flujos con tests de ruta en jsdom, axe y verificación manual. Sumar `e2e/` requiere una `api` con desafíos sembrados.
- **Reloj del día.** El cliente no calcula "hoy": usa `number`, `next_reset_at` y `seconds_to_reset` de `GET /api/today` y espera 0–3 s al azar antes de pedir de nuevo al llegar a 0 (ADR-008).
- **Fuera de alcance (diferido por decisión del usuario):** Dockerfile, CI y despliegue. Las convenciones no los cubren; el host debe servir `index.html` para cualquier ruta (fallback de SPA) y enrutar `/api/*` a la `api`.
- **Almacenamiento del navegador.** Se asumió que solo se guardan conveniencias por visitante (nunca solución, estado de partida ni tokens), siempre con `try/catch`.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
