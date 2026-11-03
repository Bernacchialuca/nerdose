---
document: Product Overview
version: "1.0"
date: 2026-11-03
status: Draft - Punto de partida para discusión
---

# Product Overview — nerdose

> Documento raíz del set de UX. Define audiencias, superficies y la relación
> entre ellas. Todos los demás artefactos UX referencian acá.

## Visión del Producto

**Problema:** Los developers y entusiastas de la tecnología no tienen un lugar con juegos diarios cortos sobre programación y tecnología que mantenga el hábito con rachas, enseñe algo al terminar y se comparta sin spoilers (PRD, goals-and-context: Problema).

**Propuesta de valor:** nerdose es una plataforma web de cinco minijuegos diarios, con un único desafío por día igual para todos, sin registro, de 1 a 3 minutos por partida, bilingüe ES/EN. Todo el contenido se genera, verifica y publica de forma automática; una sola persona opera la plataforma desde un admin aparte (G-01 a G-05).

## Inventario de Superficies

- **web** — Sitio de los jugadores en `nerdose.dev`: catálogo (home), los 5 juegos (instrucciones, partida, resultado, reporte), estadísticas y "Acerca de". Servicio: `web` (SPA React + Vite).
  - Platform: `web` (coincide con `language: react` del manifest de `web`)
  - Viewports: `mobile` (primario), `desktop` — el uso diario ocurre sobre todo en el teléfono (U-01, NFR-U01, decisión #24) y también se juega en escritorio; usable desde 320 px.
  - Accent: `#3DDC84` — verde del prototipo `docs/nerdose.html` (identidad terminal/dev, JetBrains Mono). Cada juego tiene además su acento propio, documentado en el Design System de la superficie: Devdle `#3DDC84`, Bug Hunt `#FFB547`, Big O `#5EB1FF`, Tech Timeline `#C39BFF`, Grep Grid `#F472B6`.
- **admin** — Panel del responsable en `admin.nerdose.dev`: reportes y anulación, próximos 14 días, stock de contenido y métricas. Servicio: `admin` (SPA React + Vite). UI solo en español.
  - Platform: `web` (coincide con `language: react` del manifest de `admin`)
  - Viewports: `desktop` (único) — herramienta interna de una sola persona, con tablas y previews en paralelo (ES y EN lado a lado). No hay caso de uso mobile relevado.
  - Accent: `#3DDC84` — extiende la identidad del prototipo (el prototipo no tiene pantallas de admin).

> Los servicios `api` y `generator` no tienen interfaz de usuario y no son superficies.

## Inventario de Audiencias

- **jugador** — Developers y entusiastas de la tecnología (U-01); juega anónimo, sobre todo desde el teléfono, en partidas de 1 a 3 minutos; quiere un desafío diario, cuidar sus rachas, aprender algo y compartir su resultado. No todos programan.
- **responsable** — La única persona que opera la plataforma (U-02) desde el admin; no carga ni aprueba contenido: revisa reportes, anula desafíos con error confirmado, mira los próximos desafíos, controla el stock y consulta métricas.

## Matriz Audiencia ↔ Superficie

| Audiencia \ Superficie | web | admin |
|------------------------|-----|-------|
| jugador                | Juega los desafíos del día, ve rachas y estadísticas, comparte y reporta problemas | — |
| responsable            | — | Revisa reportes y anula desafíos, mira los próximos 14 días, controla el stock y consulta métricas |

## Glosario de Dominio

- **Desafío (Challenge)** — Problema diario de un juego, igual para todos los jugadores; cambia a las 00:00 UTC.
- **Número de desafío** — Número de día de la plataforma (`#8`); es el mismo para los 5 juegos y lo usa el share.
- **Partida (Play)** — Intento de un jugador sobre el desafío de un juego en un día; una por jugador, juego y día.
- **Completar** — Terminar la partida, ganando o perdiendo; es lo que suma a la racha.
- **Racha** — Días UTC consecutivos con al menos un desafío completado, por juego y global.
- **Día neutro** — Día sin desafío publicado: no suma ni corta la racha.
- **Sin desafío hoy** — Estado de un juego sin desafío publicado en el día.
- **Anulado (voided)** — Desafío con error confirmado, cerrado manualmente por el responsable; no afecta la racha.
- **Reporte** — Aviso del jugador de que un desafío está mal (`wrong_answer`, `ambiguous`, etc.); solo alerta, nunca despublica.
- **Share** — Resultado compartible sin spoilers: emoji del juego, nombre, `#número`, resultado y `nerdose.dev`.
- **Stock de contenido** — Ítems aprobados disponibles en los bancos de términos y de hechos.
- **Próximos desafíos** — Desafíos ya generados y verificados de los próximos 14 días, visibles solo en el admin.

---

**Próximos artefactos:** Cada audiencia y superficie listada arriba tiene su documentación detallada en `docs/ux/audiences/{nombre}/` y `docs/ux/surfaces/{nombre}/` respectivamente.
