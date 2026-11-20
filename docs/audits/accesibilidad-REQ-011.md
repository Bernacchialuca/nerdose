# Auditoría de accesibilidad y mobile — REQ-011

**Story:** S-059 · **Fecha:** 2026-11-17 (`web`) · 2026-11-20 (`admin`) · **Estado:** En curso (cerrados `web` y `admin`; pendientes `games` y `ui`)

## Alcance y método

- Herramientas y versiones: `@playwright/test` 1.65.1, `@axe-core/playwright` 4.14.0, axe-core 4.14.0 (`testEngine.version`), Chromium headless shell 159.0.8154.6 (Playwright `chromium-headless-shell` v1255).
- Reglas de axe: tags `wcag2a`, `wcag2aa`, `wcag21aa`.
- Red simulada: `page.route` con los fixtures de `apps/web/src/test/fixtures/` (los mismos de MSW, tipados con `api.yaml`); los requests sin ruta se abortan y se cuentan (`unhandled` debe ser `[]`).
- Proyectos: `mobile` (Pixel 5, 320×640) y `desktop` (Desktop Chrome, 1280×720); el teclado corre solo en `desktop`. `admin`: solo `desktop`.
- Chequeos extra: `scrollWidth <= 320` (`html` y `body`), objetivos de toque >= 44×44 (exentos: links en línea dentro de un `p` y celdas dentro de `[role="grid"]`), foco visible (`:focus-visible` con outline o sombra), `prefers-reduced-motion`.
- `admin`: mismas versiones (`@playwright/test` 1.65.1, `@axe-core/playwright` 4.14.0, axe-core 4.14.0, Chromium headless shell 159.0.8154.6); solo proyecto `desktop` (Desktop Chrome, 1280×720, `timezoneId: UTC`, `locale: es-AR`); Vite aparte en el puerto 5181 con `--workers=2`; sesión sembrada en `sessionStorage` con `addInitScript` (`nerdose_admin_session`); red simulada con `page.route` y los fixtures de `apps/admin/src/test/fixtures/`; reloj fijo por pantalla con `page.clock.setFixedTime` (reportes `2026-11-11T12:00:00Z`, próximos `2026-12-01T14:10:00Z`, métricas `2026-12-10T12:00:00Z`). Resumen de la corrida final: 39 escenarios de página + 6 specs de teclado = 45 tests, todos en verde; axe **0 violaciones** en los 39 análisis.
- Lockfile antes de la auditoría: `sha256 6bda4924bf6eab2f7e5d9a144d0bcb76530dc6d2b21c3ce9c02c02a17fb60e79  pnpm-lock.yaml`.
- Resumen de la corrida final de `web` (43 escenarios + 4 chequeos + 5 teclado): `desktop` sin fallos; `mobile` con un único tipo de fallo, el chequeo de objetivos de toque (ver «320 px»). axe: **0 violaciones** en los 86 análisis (43 × 2 proyectos).

### Desvíos del método respecto del plan (para quien repita la auditoría)

1. `page.route('**/api/**')` también intercepta los módulos fuente de Vite (`/src/modules/*/api/*.ts`) y deja la app en blanco. Usar un predicado: `page.route((u) => u.pathname.startsWith('/api/'), …)`.
2. Con `webServer` de Playwright y varios workers, el dev server de Vite se satura (Tailwind v4 escanea la carpeta de trabajo) y los tests agotan el tiempo. Funciona: levantar `pnpm exec vite --port 5180 --strictPort` aparte, `reuseExistingServer: true`, `--workers=2`, y escribir los resultados (JSON de axe, capturas, trazas) **fuera del repo** (variable `E2E_RESULTS`) en lugar de `e2e/.results/`.
3. La tarjeta anulada de la home (CTA «Ver aviso de anulación») es un **link** a `/bug-hunt`, no un botón: el overlay O-02 se abre en la ruta del juego. El escenario `home-o02` navega por el link con Bug Hunt anulado.
4. Los nombres accesibles de varios botones llevan un glifo: «Empezar →», «Confirmar orden→», «Confirmar respuesta✓». Los selectores de teclado deben ser prefijos (`/^Empezar/`).
5. Tras «Empezar» el foco pasa al `h1` de la ruta (`tabindex="-1"`, sin outline por diseño): no se cuenta como foco sin indicador.

## Pantallas y estados auditados

### web

Los 43 escenarios (id · estado auditado). Las dos columnas de proyecto resumen el resultado: `desktop` pasó en todos (axe 0 violaciones, `unhandled` vacío); `mobile` pasó axe y `scrollWidth <= 320` en todos, y marcó objetivos < 44 px según la última columna.

| id | objetivos < 44 px en `mobile` |
|---|---|
| `about` | ES/EN |
| `big-o-anulado` | ES/EN, Cerrar |
| `big-o-instrucciones` | ES/EN |
| `big-o-partida` | ES/EN, pestañas de lenguaje |
| `big-o-resultado-ganado` | ES/EN, pestañas de lenguaje |
| `big-o-resultado-perdido` | ES/EN, pestañas de lenguaje |
| `bug-hunt-anulado` | ES/EN, Cerrar |
| `bug-hunt-instrucciones` | ES/EN |
| `bug-hunt-o01` | ES/EN, Cerrar, pestañas de lenguaje |
| `bug-hunt-partida` | ES/EN, pestañas de lenguaje, líneas Bug Hunt |
| `bug-hunt-resultado-ganado` | ES/EN, pestañas de lenguaje |
| `bug-hunt-resultado-perdido` | ES/EN, pestañas de lenguaje |
| `devdle-anulado` | ES/EN, Cerrar |
| `devdle-instrucciones` | ES/EN |
| `devdle-o01` | ES/EN, Cerrar, teclas Devdle |
| `devdle-partida` | ES/EN, teclas Devdle |
| `devdle-resultado-anulado` | ES/EN |
| `devdle-resultado-ganado` | ES/EN |
| `devdle-resultado-perdido` | ES/EN |
| `grep-grid-anulado` | ES/EN, Cerrar |
| `grep-grid-instrucciones` | ES/EN |
| `grep-grid-o04` | ES/EN |
| `grep-grid-partida` | ES/EN |
| `grep-grid-resultado-ganado` | ES/EN |
| `grep-grid-resultado-perdido` | ES/EN |
| `home` | ES/EN |
| `home-en` | ES/EN |
| `home-error` | ES/EN |
| `home-ningun-desafio` | ES/EN |
| `home-o02` | ES/EN, Cerrar |
| `home-sin-sesion` | ES/EN |
| `no-encontrado` | ES/EN |
| `stats` | ES/EN |
| `stats-en` | ES/EN |
| `stats-error` | ES/EN |
| `stats-historial-completo` | ES/EN |
| `stats-sin-sesion` | ES/EN |
| `stats-vacio` | ES/EN |
| `timeline-anulado` | ES/EN, Cerrar |
| `timeline-instrucciones` | ES/EN |
| `timeline-partida` | ES/EN, asas Timeline |
| `timeline-resultado-ganado` | ES/EN |
| `timeline-resultado-perdido` | ES/EN |
Rutas y fixtures: `home*` → `/` con `todayFixture` / `todayNoSessionFixture` / `todayNoChallengesFixture` / error 500; `stats*` → `/stats` con `myStatsPage1` / `myStatsPage2` / `myStatsEmpty` / 401 / 500; `about` → `/about`; `no-encontrado` → `/no-existe`; por juego `{g}-instrucciones|partida|resultado-ganado|resultado-perdido|anulado` con los `GameToday` de `src/test/fixtures/*`; overlays `devdle-o01`, `bug-hunt-o01`, `grep-grid-o04`, `home-o02`; `devdle-resultado-anulado`.

### admin

39 escenarios en `desktop` (1280×720). Resultado de todos: axe 0 violaciones, contenido esperado presente, `unhandled` vacío. Los estados transitorios (`loading`, «Ingresando…», «Anulando…», «Pidiendo…», «Consultando…») no se auditan con axe: los cubren los tests de componente (`role="status"`, `aria-disabled`).

| id | ruta | estado | fixtures / red | resultado `desktop` |
|---|---|---|---|---|
| `login` | `/login` (sin sesión) | default | — | axe 0; foco en «Contraseña», `lang="es"`, título |
| `login-error-validacion` | `/login` | error de validación | `POST login` 401 `invalid_credentials` | axe 0; `aria-invalid` + `aria-describedby` |
| `login-bloqueado` | `/login` | bloqueado | 429 `rate_limited`, `Retry-After: 720` | axe 0; `role="alert"`, botón `aria-disabled` |
| `login-error-sistema` | `/login` | error de sistema | 500 | axe 0 |
| `login-sesion-vencida` | `/reports` → `/login` | sesión vencida | `GET reports` 401 | axe 0; token borrado |
| `reportes` | `/reports` | default (gris) | `OPEN_GROUPS` | axe 0 |
| `reportes-vacio` | `/reports` | empty | `{ groups: [] }` | axe 0 |
| `reportes-error` | `/reports` | error de sistema | 500 | axe 0 |
| `reportes-resueltos` | `/reports?status=resolved` | solo lectura | `VOIDED_GROUP` | axe 0 |
| `reportes-descartados` | `/reports?status=dismissed` | vacío | — | axe 0 |
| `reportes-o02` | `/reports` | O-02 default | `DEVDLE_GROUP` | axe 0 |
| `reportes-o02-anulado` | `/reports` | O-02 anulado | `VOIDED_GROUP` | axe 0 |
| `reportes-o01` | `/reports` | O-01 default | — | axe 0 |
| `reportes-o01-error-validacion` | `/reports` | O-01 validación | — | axe 0 |
| `reportes-o01-no-anulable` | `/reports` | O-01 `not_voidable` | `POST void` 409 | axe 0 |
| `reportes-anulacion-confirmada` | `/reports` | aviso de anulación | `POST void` 200, `GET open` sin Devdle | axe 0 |
| `proximos` | `/upcoming` | default | `UPCOMING_BUG_HUNT` | axe 0 |
| `proximos-falla` | `/upcoming` | falla de generación (gris) | `UPCOMING_FAILURE` + `FAILURES_ONE` | axe 0 |
| `proximos-regeneracion-pendiente` | `/upcoming` | regeneración pendiente | `UPCOMING_PENDING` | axe 0 |
| `proximos-regeneracion-fallida` | `/upcoming` | regeneración fallida | `UPCOMING_REGEN_FAILED` | axe 0 |
| `proximos-error` | `/upcoming` | error de sistema | 500 | axe 0 |
| `proximos-o02-{devdle,grep-grid,timeline,big-o,bug-hunt}` | `/upcoming` | O-02 con preview ES/EN de cada juego | `UPCOMING_BUG_HUNT` | axe 0 en los 5 (sin violaciones dentro de los paneles de preview; sin fallback) |
| `proximos-o02-item-rechazado` | `/upcoming` | O-02 ítem rechazado | `UPCOMING_REJECTED_ITEM` | axe 0 |
| `proximos-o03` | `/upcoming` | O-03 default | — | axe 0 |
| `proximos-o03-no-disponible` | `/upcoming` | O-03 `not_regenerable` | `POST regenerate` 409 | axe 0 |
| `stock` | `/content` | default | `STOCK_OK` | axe 0 |
| `stock-bajo` | `/content` | stock bajo (gris) | `STOCK_LOW` | axe 0 |
| `stock-sin-datos` | `/content` | sin datos | `STOCK_EMPTY` | axe 0 |
| `stock-error` | `/content` | error de sistema | 500 | axe 0 |
| `metricas` | `/metrics` | default (gris) | `METRICS_OK` | axe 0 |
| `metricas-vacio` | `/metrics` | empty | `METRICS_EMPTY` | axe 0 |
| `metricas-rango-invalido` | `/metrics?from=2026-12-09&to=2026-12-01` | error de validación | sin `GET metrics` | axe 0 |
| `metricas-error` | `/metrics` | error de sistema | 500 | axe 0 |
| `metricas-orden` | `/metrics` | orden de calidad por «Victorias» | `METRICS_OK` | axe 0; un solo `th[aria-sort]` |
| `no-encontrado` | `/no-existe` | `RouteError` («Algo salió mal») | — | axe 0 |

## Violaciones encontradas

axe no encontró **ninguna violación** (WCAG 2.1 A y AA) en los 43 escenarios de `web`, en `mobile` ni en `desktop`, ni en los 39 escenarios de `admin` (`desktop`). Los hallazgos de esta auditoría vienen de los chequeos extra (objetivos de toque, ver «320 px»), de los `incomplete` y de la revisión manual.

| # | regla | impacto | pantalla/estado | proyecto | selector | dueño | corrección | estado |
|---|---|---|---|---|---|---|---|---|
| — | (sin violaciones propias de `web`) | — | — | — | — | `web` | No hizo falta cambiar código en `apps/web/src` | cerrado |
| — | (sin violaciones propias de `admin`) | — | — | `desktop` | — | `admin` | No hizo falta cambiar código en `apps/admin/src`; los «hallazgos probables» del plan (contraste de `text-dim`, `heading-order` del drawer, landmarks de `RouteError`, nombre del botón de celda) no se reprodujeron | cerrado |

## `incomplete` revisados a mano

axe devolvió 1159 nodos `incomplete`, todos de la regla `color-contrast`, agrupados por motivo. Ninguno es una violación de `web`.

| Grupo | Motivo de axe | Resolución |
|---|---|---|
| Glifos `aria-hidden` (← → ↑ ↓ ⌄ ✓ ✕ ✗ ▲ ⌫, marcas de las fichas de Devdle, íconos de estado ◐ ○ ⊘ del historial) | «contiene solo caracteres no textuales» | **Pasa.** Decorativos con `aria-hidden`; el significado va en texto o nombre accesible (`color.md`: decorativos exentos). Los íconos de estado tienen además el texto del estado. |
| Celdas y letras del tablero de Grep Grid (`role="cell"`, botones del tablero) | «contenido demasiado corto» | **Pasa.** Letra única en tamaño de juego; celdas con nombre accesible «letra, fila, columna, estado». Contraste de las letras sin estado, token `text.body` sobre `bg.surface.sunken` (>= 10:1 en `color.md`). |
| Miniaturas de las tarjetas de la home (números de línea de Bug Hunt `#7A5A2A`, letras de Grep Grid `#8A5C7A`) | «contenido demasiado corto» | **Pasa por exención.** Son `aria-hidden` (`game-thumbnail.tsx`), ilustración decorativa. Se anota que los ratios medidos contra `#0D1116` son 3,0 y 3,5, por debajo de 4,5: si alguna vez se las vuelve informativas hay que subir el token (`ui`). |
| Textos sobre los fondos con gradiente de la home y de `/about` (héroe, `h1`, `h2`, párrafos, `exit 0`, CTA) | «fondo no determinable por gradiente» | **Pasa.** Los gradientes son un acento tenue sobre `bg.canvas`/`bg.surface`; los textos usan `text.primary/body/lede/muted/dim` y `accent`, con ratios >= 6,4:1 sobre `#0A0C0F`/`#0F1318` según la tabla de `color.md`. |
| Textos dentro de diálogos O-01/O-02/O-04 (`p`, `h2`) | «fondo parcialmente tapado por otro elemento» (el scrim) | **Pasa.** `text.body`/`text.muted` sobre `bg.surface` (>= 7,0:1); el scrim solo oscurece el fondo. |
| Botón «Enviar» de Devdle y badges de la lista de palabras | «parcialmente tapado / superpuesto» | **Pasa.** Texto `accent.on` `#06120B` sobre `accent` `#3DDC84` y texto `text.muted` sobre `bg.control`, ambos >= 6:1. |

`admin` (39 escenarios): axe devolvió nodos `incomplete` solo de `color-contrast`, en dos grupos.

| Grupo | Motivo de axe | Resolución |
|---|---|---|
| Glifos `aria-hidden` (✓ ✕ ✗ ○ ↻ y la marca de las celdas de Próximos, íconos de estado) en `proximos*`, `reportes-*`, `stock-sin-datos` | «contiene solo caracteres no textuales» (22 escenarios) | **Pasa.** Decorativos con `aria-hidden`; el estado va en texto y en el nombre accesible del botón de celda. |
| Texto de los avisos de O-03 («Solo se puede regenerar…», «Se pedirá un reemplazo…») y de O-01 («Esto no se puede deshacer…») | «fondo parcialmente tapado por otro elemento» (`proximos-o03*`, `reportes-o01*`) | **Pasa.** Texto `text-text` / `text-text-body` sobre `bg-surface` dentro del diálogo (>= 7:1 en `color.md`); el scrim solo oscurece lo de atrás. |

Chequeo puntual adicional: la tecla descartada de Devdle (`#8D99A6` sobre `#11151A`) mide 6,32:1; el par `#5F6B78`/`#12161B` que el plan daba como probable falla ya no está.

## Teclado (5 juegos)

Pasada con `page.keyboard` en `desktop` (sin `click`, `tap` ni `mouse`), foco visible comprobado en cada Tab. Todos los recorridos llegan al resultado y a «Compartir» (se ve «✓ Copiado»).

| juego | elegir | confirmar | terminar | resultado | Compartir | foco visible | Tabs | observaciones |
|---|---|---|---|---|---|---|---|---|
| devdle | tipear `PARSER` con el teclado físico | Enter | sí | sí | sí | sí | 7 hasta «Empezar», 8 hasta «Compartir» | Las 28 teclas de la pantalla son paradas de Tab (el teclado físico las evita). |
| grep-grid | flechas hasta (3,2) y (3,7), Enter | Enter en la 2.ª celda (move `select` exacto) | «Rendirse» → «Sí, rendirme» | sí | sí | sí | 1 Tab entra al tablero (roving) | Nombre de celda 1-based: «M, fila 1, columna 1, libre». |
| timeline | Tab al asa, Espacio, ↓, Espacio | «Confirmar orden» + Enter | sí | sí | sí | sí | 1 Tab llega al primer asa | Body del move con 5 ids, mismo conjunto que `TL_INITIAL`. |
| big-o | flechas en el `radiogroup` hasta «O(n log n)», Espacio | «Confirmar respuesta» + Enter | sí | sí | sí | sí | 3 Tabs hasta el `radiogroup` | Antes pasa por las pestañas de lenguaje y el panel de código. |
| bug-hunt | ↓ hasta «Línea 4», Espacio | «Confirmar línea 4» + Enter | sí | sí | sí | sí | 2 Tabs hasta las líneas | Solo recorre líneas elegibles. |

Sin trampas de foco: en todos los juegos el Tab vuelve al inicio del documento tras el último control.

## Teclado · admin

Pasada con `page.keyboard` en `desktop` (sin `click`, `tap` ni `mouse`), foco visible comprobado en cada Tab (exentos: `h1[tabindex="-1"]` y el aviso de anulación, enfocados por código). Todos pasan; sin trampas de foco.

| flujo | pasos | foco visible | Tabs hasta cada destino | trampa / retorno de foco | observaciones |
|---|---|---|---|---|---|
| K-1 | login con Enter → fila «Devdle #8» → O-02 → «Resolver» → «Anular desafío» → motivo + flechas en «Culpable del error» → Enter | sí | 3 hasta la fila, 2 hasta «Resolver», 5 hasta «Anular desafío» | foco en «Motivo de la anulación» al abrir O-01; aviso «Devdle #8 anulado · 15 partidas afectadas.» enfocado | bodies exactos: `{ password }`, `{ status: 'resolved' }`, `{ void_reason, culprit: { kind: 'term', id } }` |
| K-1b | O-02 y O-01 desde Reportes | sí | — | Tab ×(focusables + 2) no sale del `dialog` (O-02: 8 focusables); Escape cierra y el foco vuelve a la fila «Devdle #8» y al botón «Anular Devdle #8» | spec adicional al plan |
| K-2 | Próximos → celda «Grep Grid #35» → O-02 → Escape → «Regenerar» → O-03 → Escape → confirmar | sí | 34 hasta la celda (las celdas anteriores son paradas), 1 hasta «Regenerar», 3 hasta confirmar | trampa y Escape en O-02 y O-03; el foco vuelve al botón de la celda y al de «Regenerar» | tras el 202, «Hay una regeneración en curso…» con body `{}` |
| K-3 | Stock: Tab por las regiones | sí | las 4 regiones de tabla reciben foco una vez | — | «Tabla de términos por juego», «hechos por juego», «ítems rechazados», «palabras rechazadas» |
| K-4 | Métricas: «Desde», «Hasta», Enter, orden por «Victorias» | sí | 1 hasta «Desde», 2 hasta «Hasta», 19 hasta «Victorias» | — | URL `from=2026-12-01&to=2026-12-09`, `aria-sort` en «Victorias». El orden de los segmentos del `input[type=date]` en Chromium headless es mes/día/año (se tipea `12012026`): depende del navegador, no es un fallo de `admin` |
| K-5 | «Cerrar sesión» + Enter | sí | 13 desde el `h1` (el encabezado queda antes del `main`; el Tab vuelve al inicio del documento) | — | URL `/login`, sin `nerdose_admin_session` |

Observación de método: el indicador interno del selector de fecha de Chromium no activa `:focus-visible` en el `input`; se exime en el helper y el control tiene anillo en los segmentos.

## 320 px

- `admin` no se audita a 320 px (superficie de un solo viewport `desktop`; supuesto [Pulido / admin] de REQ-011).
- `document.documentElement.scrollWidth` y `document.body.scrollWidth` <= 320 en los 43 escenarios de `mobile` (el chequeo no registró ningún desborde); el código de Big O y Bug Hunt desplaza dentro de su bloque.
- `/stats`: dos contenedores con scroll horizontal (la tabla del historial 958 > 214 y el heatmap 280 > 212), ambos alcanzables con teclado (`focusable=true`) y con una única parada de Tab en el `role="grid"`; sin violación de `scrollable-region-focusable`.
- Contenido cortado (revisión de capturas): Timeline en resultado parte «Kubernetes» en dos líneas («Kuberne/tes») dentro de la fila a 320 px. Se deriva a `games` (corte de palabra en la fila del resultado).
- Objetivos de toque < 44×44 (`mobile`), fuera de exentos:

| Elemento | Medida | Dueño | Origen | Estado |
|---|---|---|---|---|
| Botones ES / EN del selector de idioma | 44×36 de caja, 44×44 efectivos | `ui` | `packages/ui/src/components/segmented-control.tsx` (`h-9` + `before:-inset-y-1` amplía el área tocable 4 px arriba y abajo) | **Excepción aceptada**: el área de toque medida con el pseudo-elemento es 44×44; el chequeo mide la caja. |
| «Cerrar» de los diálogos | 32×32 | `ui` | componente de diálogo/aviso de `@nerdose/ui` | Derivado a `ui` |
| Teclas del teclado de Devdle | 20–31 × 54 | `games` | `packages/games/devdle/src/client/keyboard.tsx` | Derivado a `games` (10 teclas por fila en 288 px no llegan a 44 de ancho; evaluar excepción justificada por espaciado o teclado reducido) |
| Asas de Timeline | 21–22 × 44 | `games` | `packages/games/timeline/src/client/sortable-row.tsx` | Derivado a `games` |
| Pestañas de lenguaje de Big O y Bug Hunt | 48–112 × 40 | `games`/`ui` | pestañas de `code-block.tsx` | Derivado a `games` |
| Líneas elegibles de Bug Hunt | 254–435 × 40 | `games` | `packages/games/bug-hunt/src/client/code-block.tsx` | Derivado a `games` (alto 40) |

## Sin color (CA 30)

| Elemento | Señal no cromática | Evidencia |
|---|---|---|
| Estados de la home | Texto visible por tarjeta: «✓ 4/6», «en curso», «sin jugar», «sin desafío hoy», «anulado» | TS-7 (aserción de texto + captura en gris) |
| Historial de `/stats` | Estado en texto («ganada», «perdida», «anulada») y `✓ 4/6` | TS-13 |
| Heatmap | Nombre accesible por celda «jueves, 13 de agosto de 2026: 0 de 5 desafíos completados» y resumen «7 desafíos completados en los últimos 365 días» | TS-13 |
| Devdle | Fichas correctas con ✓, ausentes con borde punteado y «~», descartadas con «✕» | Captura en gris de `devdle-resultado-perdido`: se distinguen sin color |
| Timeline | «✓ bien» / «✕ va en N°» + borde punteado; «3/5 posiciones correctas» | Captura en gris de `timeline-resultado-perdido` |
| Grep Grid | Celdas encontradas rellenas, reveladas con borde punteado; nombre de celda con el estado | Capturas en gris (`grep-grid-resultado-*`) y nombres accesibles |
| Big O / Bug Hunt | Etiquetas «tu elección» / «correcta» y glifos en las opciones; ✓/✕ en las líneas | Capturas en gris generadas; revisar con `games` |

| Tablas de métricas (`admin`) | «—» para `null` (p. ej. D7 de la cohorte sin datos), «publicado» / «anulado» en texto en la tabla de calidad, orden activo con `aria-sort` (un solo `th`) | TS-15, TS-17, `metricas` en gris: las filas y estados se distinguen sin color |
| Celdas de Próximos (`admin`) | Cada celda lleva el texto del estado y su glifo («Aprobado», «Sin desafío», «Falla de generación · 20 intentos · no_valid_term», «Regenerando…»); la falla tiene texto además del fondo `status-warning`; la leyenda lista los estados | TS-9, TS-10, `proximos-falla` en gris |
| «alertado» de Reportes (`admin`) | Texto «alertado» en la fila; contador del encabezado con nombre «3 grupos de reportes abiertos» | TS-4, `reportes` en gris |
| «Alcanza para ciclar: No» de Stock (`admin`) | Texto «No» con «⚠», no solo color | TS-14, `stock-bajo` en gris |

## Excepciones aceptadas

| Excepción | Criterio WCAG | Justificación | Referencia |
|---|---|---|---|
| Tabla de historial con scroll horizontal en un contenedor a 320 px | 1.4.10 Reflow | Tabla de datos de 3 columnas; el contenedor es alcanzable con teclado y lo permite `foundations/grid.md` | DS `web` grid |
| Celdas del tablero de Grep Grid < 44 px | 2.5.8 (proyecto: 44 px) | Tablero 12×12 en 256 px; `role="grid"` con roving tabindex | S-024, `foundations/grid.md` |
| Celdas del heatmap < 44 px | 2.5.8 | Grilla de datos con alternativa por teclado y dato en texto (`detalle-dia`) | S-056, REQ-011 |
| Botones ES/EN: caja 44×36 con área tocable de 44×44 por pseudo-elemento | 2.5.8 | Medida con `::before` de 4 px | `segmented-control.tsx` |
| Controles deshabilitados | 1.4.3 | Exentos por la norma | `color.md` |
| Links en línea dentro de un párrafo | 2.5.8 (en línea) | Excepción «inline» | WCAG 2.5.8 |
| Miniaturas de las tarjetas con contraste < 4,5:1 (`aria-hidden`) | 1.4.3 | Decorativas | `game-thumbnail.tsx` |
| `admin`: objetivos de toque (p. ej. «Cerrar» de los diálogos 32×32) no evaluados | 2.5.8 (proyecto: 44 px) | Superficie de escritorio de un solo usuario; WCAG 2.1 AA no tiene criterio de tamaño de objetivo; el supuesto de REQ-011 limita `admin` a accesibilidad y desktop (el UI-1 de `web` ya cubre el componente) | P-2 del plan admin, REQ-011 [Pulido / admin] |
| `admin`: estados transitorios no auditados con axe | — | Requieren congelar la red a mitad de request; cubiertos por tests de componente | P-11 del plan admin |

## Hallazgos derivados

### ui — Pendiente de corregir (plan ui de S-059)

| # | Hallazgo | Dónde | Escenarios (`mobile`) | Valor medido | Origen |
|---|---|---|---|---|---|
| UI-1 | Objetivo de toque 32×32 en «Cerrar» de diálogos y avisos | `button "Cerrar"` | `*-anulado`, `bug-hunt-o01` | 32×32 | componente de diálogo de `packages/ui/src/components` |
| UI-2 | Miniaturas: texto decorativo bajo 4,5:1 (informativo, sin impacto mientras sean `aria-hidden`) | línea de código de Bug Hunt `#7A5A2A` (3,0:1 sobre `#0D1116`) y letras de Grep Grid `#8A5C7A` (3,5:1) | `home*` | ver columna | `packages/ui/src/components/game-thumbnail.tsx` |
| UI-3 | Las pestañas de lenguaje (si son de `ui`) miden 40 px de alto | `button[role=tab]` de Big O y Bug Hunt | `big-o-partida`, `bug-hunt-partida`, resultados | 48–112 × 40 | verificar origen (`code-block` de los juegos o `ui`) |

`admin` no agregó hallazgos a `ui` ni a `games`: los 5 `Preview` de O-02 desde Próximos y los componentes de `ui` que usa `admin` no produjeron violaciones; en el único punto que toca a UI-1 («Cerrar» 32×32 en O-01, O-02 y O-03) no hay criterio de fallo en `admin` (ver «Excepciones aceptadas»).

### games — Pendiente de corregir (plan games de S-059)

| # | Hallazgo | Dónde | Escenarios (`mobile`) | Valor medido | Origen |
|---|---|---|---|---|---|
| G-1 | Teclas de Devdle de 20–31 px de ancho | `keyboard.tsx` | `devdle-partida`, `devdle-o01` | 20–31 × 54 | `packages/games/devdle/src/client/keyboard.tsx` |
| G-2 | Asas de Timeline de 21–22 px de ancho | `sortable-row.tsx` | `timeline-partida` | 21–22 × 44 | `packages/games/timeline/src/client/sortable-row.tsx` |
| G-3 | Líneas elegibles de Bug Hunt de 40 px de alto | `code-block.tsx` | `bug-hunt-partida` | 254–435 × 40 | `packages/games/bug-hunt/src/client/code-block.tsx` |
| G-4 | Pestañas de lenguaje de 40 px de alto | `code-block.tsx` de Big O y Bug Hunt | `big-o-*`, `bug-hunt-*` | 48–112 × 40 | `packages/games/{big-o,bug-hunt}/src/client/code-block.tsx` |
| G-5 | «Kubernetes» se parte en «Kuberne/tes» a 320 px en la fila de resultado | fila de resultado de Timeline | `timeline-resultado-*` | corte de palabra | `packages/games/timeline/src/client/` |
| G-6 | Los números de línea del código usan `#4F5A66` (2,7:1 según `color.md`) | `code-block.tsx` | `big-o-partida`, `bug-hunt-partida` | 2,7:1 (dato de `color.md`; axe lo marcó `incomplete`, no violación) | `packages/games/{big-o,bug-hunt}/src/client/code-block.tsx` |

## Cómo repetir la auditoría

1. Guardar `sha256sum pnpm-lock.yaml`. Instalar: `pnpm --filter web add -D --save-exact @playwright/test @axe-core/playwright` y `pnpm --filter web exec playwright install chromium`.
2. `playwright.config.ts`: `testDir: './e2e'`, `outputDir` fuera del repo, `use: { baseURL: 'http://localhost:5180', timezoneId: 'UTC' }`, proyectos `mobile` (`devices['Pixel 5']` con `viewport: { width: 320, height: 640 }`) y `desktop` (`devices['Desktop Chrome']`), `webServer` o servidor Vite aparte en `--port 5180 --strictPort` con `reuseExistingServer: true`.
3. Red simulada: `mockApi(page, routes)` con `page.route((u) => u.pathname.startsWith('/api/'), …)`, clave `${METHOD} ${pathname}`, respuestas de `src/test/fixtures/*`, `unhandled` y `calls`.
4. Helpers: `auditA11y` (`new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()`, volcado de `violations` e `incomplete` a JSON), `expectNoHorizontalScroll` (`scrollWidth` de `html` y `body` <= 320), `findSmallTargets` (`a[href], button, input, select, textarea, [role=button|tab|radio], [tabindex="0"]` con caja < 44×44, excluyendo links en línea y `[role=grid]`), `expectFocusVisible` y `tabTo`.
5. Escenarios: los 43 de la sección «Pantallas y estados auditados» (home ×6, stats ×6, about, 404, 5 juegos × 5 estados, y 4 overlays/resultado anulado) con `DEFAULT_ROUTES`: `POST /api/session`, `GET /api/today`, `GET /api/games/{g}/today` (no iniciado), `GET /api/me/stats`, `PATCH /api/me/preferences`.
6. Teclado: una spec por juego con rutas con estado (`GET today` cambia tras `start` y tras `move`), `navigator.share` anulado con `addInitScript` y permisos de portapapeles.
7. Ejecutar con `--workers=2` y el servidor Vite ya levantado. Para los planes `games` y `ui`: volver a correr solo los escenarios afectados (`-g`).
8. Retiro: `pnpm --filter web exec playwright uninstall` (opcional), `pnpm --filter web remove @playwright/test @axe-core/playwright`, borrar `playwright.config.ts` y `e2e/`, y comparar el hash del lockfile.
9. `admin`: proyecto `desktop` único (1280×720, `locale: es-AR`), Vite en el puerto 5181 (`pnpm exec vite --port 5181 --strictPort` en `apps/admin`), `seedSession` con `addInitScript` (`sessionStorage` `nerdose_admin_session`), relojes por pantalla con `page.clock.setFixedTime`, defaults de red `GET /api/admin/{reports,generation-failures,challenges/upcoming,content/stock,metrics}` con los fixtures de `src/test/fixtures/`, 39 escenarios + specs de teclado, y comandos con `--filter admin` (`pnpm --filter admin add -D --save-exact @playwright/test @axe-core/playwright`, `pnpm --filter admin exec playwright install chromium`).

## Cierre

### web

Cerrado en `web` (2026-11-17):

- Auditoría: 43 escenarios × 2 proyectos, 5 specs de teclado y 4 chequeos; axe 0 violaciones; ningún hallazgo con dueño `web` (no se tocó `apps/web/src`, por eso no hay tests de regresión nuevos). Lo pendiente depende de `ui` y `games` (ver «Hallazgos derivados»).
- Retiro: `pnpm --filter web exec playwright uninstall`, `pnpm --filter web remove @playwright/test @axe-core/playwright`, borrados `apps/web/playwright.config.ts` y `apps/web/e2e/`, script `e2e` y `include` de `tsconfig.json` restaurados.
- `grep "@playwright/test\|@axe-core/playwright" apps/web/package.json pnpm-lock.yaml`: sin coincidencias; `apps/web/playwright.config.ts` y `apps/web/e2e/` no existen; sin scripts `e2e*`.
- Hash del lockfile idéntico al previo (`6bda4924…0e79`), `git diff` de `pnpm-lock.yaml` vacío.
- Exit 0: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test` (un timeout aislado de `web#test` bajo carga al correr todo junto no se repitió; 625 tests pasan).
- `docs/architectures/web/conventions/testing-e2e.md`: coherente (no hay suite, Playwright no es herramienta vigente, remite a este informe, D3 abierta); sin cambios.

### admin

Cerrado en `admin` (2026-11-20):

- Auditoría: 39 escenarios en `desktop` + 6 specs de teclado; axe 0 violaciones; ningún hallazgo con dueño `admin` (no se tocó `apps/admin/src`, por eso no hay tests de regresión nuevos ni cambios en el DS de `admin`); sin hallazgos nuevos para `ui` ni `games`.
- Retiro: `pnpm --filter admin remove @playwright/test @axe-core/playwright`, borrados `apps/admin/playwright.config.ts` y `apps/admin/e2e/`, script `e2e` y `include` de `tsconfig.json` restaurados.
- `grep "@playwright/test\|@axe-core/playwright" apps/admin/package.json pnpm-lock.yaml`: sin coincidencias; `apps/admin/playwright.config.ts` y `apps/admin/e2e/` no existen; sin scripts `e2e*`; `grep -rn playwright apps/admin` (sin `node_modules`, `dist`) vacío.
- Hash del lockfile idéntico al previo (`6bda4924…0e79`), `git diff` de `pnpm-lock.yaml` vacío; resultados temporales fuera del repo borrados.
- Exit 0: `pnpm install --frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.
- `docs/architectures/admin/conventions/testing-e2e.md`: coherente (no hay suite, Playwright no es herramienta vigente, remite a este informe, D3 abierta); sin cambios.
### games — Pendiente
### ui — Pendiente
