# admin — Overview

## Proposito
SPA del responsable de nerdose (`admin.nerdose.dev`). Permite iniciar sesión, revisar reportes de jugadores y anular desafíos, ver los próximos 14 días (preview con solución y regeneración), explorar los bancos de contenido, controlar su stock y consultar las métricas del producto. Es una herramienta interna de un solo usuario, solo en español y sin analítica.

## Tipo de servicio
Frontend en React 19 + Vite (SPA, sin SSR), TypeScript estricto.

## Modulos / superficies
- **auth** — `/login`, token JWT en `sessionStorage`, guard de rutas y cierre de sesión.
- **reports** — `/reports`: reportes de jugadores; resolver, descartar y anular el desafío.
- **upcoming** — `/upcoming`: próximos 14 días; cada celda es una tarjeta «Ver detalle ›» que abre el detalle con la preview del `client` de cada juego en modo solución (solo en español desde REQ-012) y, solo ahí, el pedido de regeneración con polling.
- **banks** — `/banks` (REQ-012): ítems de los bancos (pestañas Términos / Hechos) con búsqueda con debounce, filtros en la URL y paginado en el servidor de a 25 (`GET /api/admin/content/items`).
- **content-stock** — `/content` (etiqueta «Stock»): stock de los bancos a ancho completo (sin los ítems que cada juego excluye), resumen de rechazados con enlace a Bancos, top 50 de palabras rechazadas paginado de a 10 y estado de los jobs.
- **metrics** — `/metrics`: las vistas `metrics_*` mostradas como tablas HTML simples (sin librería de gráficos); jugadores diarios y calidad paginadas de a 15.
- **components** — `src/components/pagination.tsx` (REQ-012): `Pagination` («‹ Anterior · 1–25 de N · Siguiente ›», no se dibuja con una sola página) y `usePagination` (paginado en el cliente para listas que llegan enteras: Reportes de a 20, Métricas de a 15, rechazadas de a 10).

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
- **Rutas supuestas.** Los documentos no fijan las rutas del admin; se asumió `/login`, `/reports`, `/upcoming`, `/content` y `/metrics`, con `/` redirigiendo a `/reports`; REQ-012 suma `/banks`. Nav: Reportes · Próximos · Bancos · Stock · Métricas.
- **UI solo en español, sin i18n propio.** Los textos del admin se escriben directamente en español. El código de la app no usa `t()`. Las previews de los juegos se traducen solas con los recursos de su paquete y desde REQ-012 se muestran solo en español.
- **Preview en modo solución.** Los `client` exportan `Preview({ payload, language })` (REQ-008); el admin lo monta solo con `language: 'es'` (REQ-012). Historia: se asumió que los `client` podían renderizarse en modo solución recibiendo el `payload` completo (con `es` y `en`) y en modo de solo lectura. El contrato de props de los `client` aún no está definido (ADR-006 solo lista `Instructions`, `Game`, `Result`, `share`); hay que cerrarlo en el diseño de la story correspondiente.
- **Intervalo de polling.** Confirmado en REQ-008: 5 s, solo mientras algún juego tenga `regeneration.status = 'pending'`. El shell muestra "Próximos (n)" con `GET /api/admin/generation-failures`.
- **Design System.** Todavía no existe; lo generará `/product-ux-generate` en `docs/design-system/`. Cuando exista, sus tokens mandan sobre los de la convención `styling`.
- **Convenciones en inglés, documentos de servicio en español**, como pide el template de convenciones del workflow.
- **Vite y los clients de los juegos (REQ-012/S-069).** `vite.config.ts` declara `optimizeDeps.entries: ['index.html', '../../packages/games/*/src/client/index.ts']`: los clients se cargan con `import()` y traen deps (zod, dnd-kit, shiki) que el admin no declara; sin escanearlos al arrancar, Vite las descubría al abrir la preview, re-optimizaba y el import fallaba con «504 Outdated Optimize Dep».
- **Fuera de alcance (diferido por decisión del usuario):** Dockerfile, CI y despliegue. El host debe servir `index.html` para cualquier ruta y enrutar `/api/admin/*` a la `api`.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
