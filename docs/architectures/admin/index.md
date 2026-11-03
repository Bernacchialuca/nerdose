# admin — Arquitectura

> Auto-generado desde [manifest.yaml](./manifest.yaml). No editar a mano.

**Tipo:** frontend | **Lenguaje:** react

## Especifico del servicio
- [Overview](./overview.md)
- [Manifest](./manifest.yaml)

## Convenciones activas

- **[Convenciones generales (React + Vite)](./conventions/_base.md)** — Base conventions for the nerdose React 19 + Vite single-page apps (always active) (custom)
- **[Routing (React Router)](./conventions/routing.md)** — Client-side routing for the admin SPA with React Router, a login route and a protected area (custom)
- **[Autenticación del admin (JWT)](./conventions/auth.md)** — Admin login with a JWT kept in sessionStorage and sent as a Bearer token; 401 clears it (custom)
- **[Datos del servidor (TanStack Query)](./conventions/data-fetching.md)** — Same-origin JSON client, snake_case contracts and TanStack Query for all server data (custom)
- **[UI de juegos (preview con solución)](./conventions/game-clients.md)** — How the admin mounts each game's client package in solution mode for challenge previews (custom)
- **[Estilos (Tailwind CSS v4)](./conventions/styling.md)** — Tailwind CSS v4 with the prototype's visual tokens declared in @theme and owned by @nerdose/ui (custom)
- **[Manejo de estado](./conventions/state-management.md)** — Where each kind of state lives in the SPA: server cache, URL, local component state and minimal context (custom)
- **[Accesibilidad (WCAG 2.1 AA)](./conventions/accessibility.md)** — Mobile-first, keyboard-complete, non-color-dependent UI that meets WCAG 2.1 AA (custom)
- **[Tests unitarios (Vitest + Testing Library)](./conventions/testing-unit.md)** — Unit and component tests with Vitest, Testing Library and axe-core for the SPAs (custom)
- **[Tests E2E (Playwright)](./conventions/testing-e2e.md)** — End-to-end tests with Playwright and axe-core against the built SPA and a real api (custom)
- **[Manejo de errores](./conventions/error-handling.md)** — Error boundaries, typed ApiError codes and Spanish recovery messages for the admin SPA, with 401 handling (custom, auto-incluida)

> Donde el tag es " (auto-incluida)" si vino por `required_by`, " (custom)" si esta en el path del servicio, y vacio si es del catalogo elegida explicitamente. En este servicio todas son custom porque no existe catalogo para `react`.

---

**Total:** 11 convenciones activas.
