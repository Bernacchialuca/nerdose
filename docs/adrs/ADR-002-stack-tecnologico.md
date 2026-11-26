# ADR-002: Stack tecnológico

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** stack, lenguajes, frameworks, testing

## Contexto

Los mismos contratos tienen que valer en tres lugares:
- en el front, que valida la jugada antes de enviarla;
- en la `api`, que la valida de verdad;
- en el `generator`, que produce el payload.

Esos contratos son los schemas de jugada, la vista pública, el resultado y los tipos de payload de cada juego. Escribirlos una sola vez evita discrepancias, que en este producto son bugs de anti-spoiler o de validación.

Además:
- La UI es 100% interactiva y por jugador: no hay contenido indexable que pida SSR.
- La SPA se usa sobre todo en mobile y tiene que cargar en < 3 s con 4G (NFR-P02), así que cada juego tiene que cargarse por separado.
- El `generator` tiene que compilar y ejecutar snippets en JS, Go y Java (Big O, Bug Hunt).
- Node 22 deja de tener soporte en abril de 2027, poco después del lanzamiento.

## Decisión

Vamos a usar **TypeScript en todo**, con Node.js 24 LTS en el backend.

**Front (`web` y `admin`):**
- React 19 + Vite + React Router (cada juego con `React.lazy`).
- TanStack Query para datos de servidor.
- Tailwind CSS v4, con los tokens del prototipo en `@theme`.
- `@fontsource/inter` (prosa) y `@fontsource/jetbrains-mono` (resto), ambas self-hosted.
- i18next + react-i18next (solo textos de UI; el contenido llega resuelto desde la `api`).
- dnd-kit (`TouchSensor` + `KeyboardSensor`) para Tech Timeline.
- Shiki (core, motor de regex JS, gramáticas js/go/java), cargado lazy solo en Big O y Bug Hunt.
- Zod (schemas de jugada del paquete de cada juego).
- Web Share API con Clipboard API como alternativa.

**Back (`api`):**
- Node.js 24 LTS + Hono + `@hono/node-server`.
- Zod + `@hono/zod-validator`.
- Drizzle ORM + drizzle-kit, con el driver postgres.js.
- `hono/jwt` (HS256) y `node:crypto` (`scrypt`, `timingSafeEqual`).
- `hono-rate-limiter` (store en memoria).
- pino (logs JSON).

**Worker (`generator`):**
- Node.js 24 LTS (TS), croner y pure-rand (xoroshiro128+).
- Toolchains Go ≥ 1.25 y JDK 21 LTS. Java corre en modo *source-file* (`java Main.java`).
- Diccionario ENABLE (dominio público).
- pino.

**Testing:** Vitest (unit, contrato y componentes con Testing Library + axe en jsdom). Sin e2e en navegador por ahora (deuda D3); Playwright se usó solo de forma temporal en la auditoría de REQ-011 y se desinstaló.

## Reglas de Implementación

- Todo el código propio MUST ser TypeScript con `strict: true`. MUST NOT haber archivos `.js` de código fuente en `apps/` ni en `packages/` (salvo configuración de herramientas).
- `api` y `generator` MUST correr en Node.js 24 LTS. `engines.node` MUST ser `">=24 <25"`.
- El framework HTTP de la `api` MUST ser Hono. MUST NOT usarse Express, Fastify ni NestJS.
- Todo acceso a la base MUST pasar por Drizzle ORM con el driver postgres.js. SQL crudo solo en migraciones, en las vistas `metrics_*` y donde Drizzle no lo soporte (`LISTEN`, `pg_notify`, `pg_try_advisory_lock`, `FOR UPDATE SKIP LOCKED`).
- Toda entrada HTTP (body, query, params) MUST validarse con Zod vía `@hono/zod-validator`. Los schemas de jugada MUST importarse del paquete del juego, nunca redefinirse.
- `web` y `admin` MUST ser SPAs con React 19 + Vite. MUST NOT usarse SSR ni Next.js/Remix.
- Cada juego MUST cargarse en `web` con `React.lazy` en la ruta `/:game_id`. Shiki MUST cargarse solo en las rutas `big-o` y `bug-hunt`.
- Los estilos MUST ser Tailwind CSS v4, con los tokens en `@theme`. MUST NOT cargarse fuentes ni CSS de CDNs de terceros.
- Los textos de UI MUST pasar por i18next con claves en `es` y `en`. Los textos de contenido MUST venir resueltos desde la `api`.
- El PRNG del `generator` MUST ser `pure-rand` (xoroshiro128+). MUST NOT usarse `Math.random()` en la generación de desafíos.
- Los tests MUST usar Vitest. MUST NOT agregarse un runner e2e de navegador sin un ADR que lo decida (deuda D3).

## Consecuencias

### Positivas
- Los schemas, los tipos y las reglas de cada juego se escriben una vez y los usan front, `api` y `generator`.
- La SPA con code splitting por juego mantiene liviana la home.
- Hono, Drizzle y postgres.js son livianos y tipados, con soporte nativo de `LISTEN/NOTIFY`.
- Node 24 LTS tiene soporte hasta abril de 2028.

### Negativas
- El `generator` necesita tres toolchains, lo que hace más pesada su imagen o su entorno.
- El ecosistema JS cambia rápido: puede haber migraciones de versión (React, Tailwind, Vite).
- Los tipos de TypeScript desaparecen en runtime, así que toda entrada externa necesita validación con Zod.

### Riesgos
- **Riesgo:** una librería de UI (dnd-kit, Shiki) no cumple accesibilidad o peso en mobile.
  - **Mitigación:** las dos quedan aisladas en el `client` del juego que las usa y se pueden reemplazar sin tocar el shell.
- **Riesgo:** diferencias de versión de Go/JDK entre el entorno local y el de producción del `generator` cambian la salida de la verificación.
  - **Mitigación:** versiones mínimas fijas (Go ≥ 1.25, JDK 21) y un job de CI que compila el código emitido.

## Alternativas Consideradas

### Alternativa 1: Fastify en lugar de Hono

**Pros:**
- Maduro, rápido y con ecosistema amplio.

**Contras:**
- Más configuración para cookies, JWT y validación tipada.

**Por qué se descartó:** Hono trae cookies, JWT y validación con Zod integrados con menos código. Las dos opciones son válidas; la decisión ya estaba tomada en `ARCHITECTURE.md`.

---

### Alternativa 2: Next.js / Remix (SSR)

**Pros:**
- Front y back juntos, routing integrado.

**Contras:**
- El SSR no aporta nada: todo es por jugador y por día.
- Mezcla la `api` con el front y complica separar el admin en su propio subdominio.

**Por qué se descartó:** complejidad sin beneficio para una SPA interactiva.

---

### Alternativa 3: Node.js 22 LTS

**Pros:**
- Más tiempo en el mercado.

**Contras:**
- Deja de tener soporte en abril de 2027.

**Por qué se descartó:** quedaría sin soporte poco después del lanzamiento.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Tecnologías por Servicio, Arq-2, Arq-3, Arq-4
- `docs/ARCHITECTURE.md` — §4 Stack
