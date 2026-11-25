# admin — Overview

## Proposito
SPA del responsable de nerdose (`admin.nerdose.dev`). Permite iniciar sesión, revisar reportes de jugadores y anular desafíos, ver los próximos 14 días (preview con solución y regeneración), controlar el stock de contenido de los bancos y consultar las métricas del producto. Es una herramienta interna de un solo usuario, solo en español y sin analítica.

## Tipo de servicio
Frontend en React 19 + Vite (SPA, sin SSR), TypeScript estricto.

## Modulos / superficies
- **auth** — `/login`, token JWT en `sessionStorage`, guard de rutas y cierre de sesión.
- **reports** — `/reports`: reportes de jugadores; resolver, descartar y anular el desafío.
- **upcoming** — `/upcoming`: próximos 14 días con preview de cada desafío usando el `client` de cada juego en modo solución (es y en lado a lado) y pedido de regeneración con polling.
- **content-stock** — `/content`: stock de los bancos de contenido y estado de los jobs.
- **metrics** — `/metrics`: las vistas `metrics_*` mostradas como tablas HTML simples (sin librería de gráficos).

## Stack y decisiones aplicadas
- React 19, Vite, React Router, TanStack Query, Tailwind CSS v4 con los tokens compartidos de `@nerdose/ui` (ADR-002).
- Cliente HTTP de mismo origen (`/api/admin/*`), JSON en `snake_case` sin transformar y errores por `error.code` (ADR-015). En desarrollo el proxy de Vite emula el mismo origen (`/api/admin` -> api).
- Autenticación: JWT HS256 de 8 h en `sessionStorage`, enviado como `Authorization: Bearer`; ante un `401` se borra el token y se vuelve al login; sin refresh ni multiusuario (ADR-010). Nunca usa la cookie `nd_pid`.
- Polling explícito de próximos desafíos mientras haya una regeneración pendiente.
- Preview con los `client` de `packages/games/<game_id>/client` y un registry propio, sin lógica por juego (ADR-006).
- Sin analítica: no carga scripts de analítica ni de tracking (ADR-014).
- Contextos de React a nivel app: solo `AuthProvider` además del `QueryClientProvider`.
- Pruebas: Vitest + Testing Library (unit) y axe-core vía `vitest-axe` (accesibilidad de componentes). Sin suite e2e (deuda D3, ver `testing-e2e`); la auditoría de accesibilidad de REQ-011 (S-059) fue puntual.

## Notas adicionales
- **Sin catálogo para `react`.** El catálogo del workflow (`.claude/conventions/`) solo trae `nextjs`, que asume App Router, Server Components y Server Actions que esta SPA no usa. Por decisión del proyecto `admin` declara `language: react` y define **todas** sus convenciones, incluida `_base`, como custom en `docs/architectures/admin/conventions/`. Así ninguna convención de Next.js entra por catálogo ni por `required_by`.
- **Convenciones compartidas con `web`.** `_base`, `data-fetching`, `styling`, `state-management`, `accessibility`, `testing-unit` y `testing-e2e` son idénticas a las de `web`; si se cambia una, hay que cambiar la otra. `routing`, `error-handling` y `game-clients` son variantes propias de admin; `auth` existe solo aquí.
- **Rutas supuestas.** Los documentos no fijan las rutas del admin; se asumió `/login`, `/reports`, `/upcoming`, `/content` y `/metrics`, con `/` redirigiendo a `/reports`.
- **UI solo en español, sin i18n propio.** Los textos del admin se escriben directamente en español. Se inicializan dos instancias fijas de i18next (es y en) únicamente para que los `client` de los juegos, que traducen su UI con react-i18next, se vean en cada panel de la preview. El código de la app no usa `t()`.
- **Preview en modo solución.** Se asumió que los `client` pueden renderizarse en modo solución recibiendo el `payload` completo (con `es` y `en`) y en modo de solo lectura. El contrato de props de los `client` aún no está definido (ADR-006 solo lista `Instructions`, `Game`, `Result`, `share`); hay que cerrarlo en el diseño de la story correspondiente.
- **Intervalo de polling.** Confirmado en REQ-008: 5 s, solo mientras algún juego tenga `regeneration.status = 'pending'`. El shell muestra "Próximos (n)" con `GET /api/admin/generation-failures`.
- **Design System.** Todavía no existe; lo generará `/product-ux-generate` en `docs/design-system/`. Cuando exista, sus tokens mandan sobre los de la convención `styling`.
- **Convenciones en inglés, documentos de servicio en español**, como pide el template de convenciones del workflow.
- **Fuera de alcance (diferido por decisión del usuario):** Dockerfile, CI y despliegue. El host debe servir `index.html` para cualquier ruta y enrutar `/api/admin/*` a la `api`.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
