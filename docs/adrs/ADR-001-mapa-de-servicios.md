# ADR-001: Mapa de servicios

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** arquitectura, servicios, alcance

## Contexto

nerdose es un proyecto personal que desarrolla y opera una sola persona, para ~1.000 jugadores diarios con un pico a las 00:00 UTC. El dominio tiene 6 contextos (Identity, Gameplay, Progress, Quality, Challenge Publishing, Content Banks) y dos audiencias con frontends distintos: jugadores en `nerdose.dev` y el responsable en `admin.nerdose.dev`.

Hay dos cargas de trabajo muy distintas:
- **Servir partidas:** baja latencia (< 300 ms P95), sin ejecutar código y sin llamar a APIs externas.
- **Producir contenido:** generar, ejecutar snippets en JS/Go/Java y verificar. Es lento, necesita toolchains pesados y no tiene que afectar a los jugadores.

**Restricciones:** una sola persona para operar todo, sin presupuesto definido, sin SLA (NFR-A01). Por eso cada pieza de infraestructura tiene que justificarse.

## Decisión

Vamos a tener **4 servicios y un PostgreSQL compartido**, sin bus de mensajes ni Redis:

| Servicio | Rol | Contextos |
|---|---|---|
| `web` | SPA de jugadores | UI de Gameplay, Progress e Identity |
| `admin` | SPA del responsable | UI de Quality; lectura de Challenge Publishing y Content Banks |
| `api` | Única interfaz HTTP | Identity, Gameplay, Progress, Quality |
| `generator` | Worker siempre activo, sin interfaz de red | Challenge Publishing, Content Banks |

Lo que se descartó como servicio aparte, y dónde vive:
- **Stats/progreso** → dentro de `api`: los agregados se actualizan en la misma transacción que cierra la partida.
- **Contenido/bancos** → dentro de `generator`: comparte scheduler y propiedad del contenido, y es su único consumidor. Los bancos salen de un dataset versionado que el `generator` carga al arrancar (ADR-016).
- **Scheduler externo y cola (Redis/BullMQ)** → scheduler interno del `generator` + Postgres (ver ADR-005 y ADR-007).
- **Publicador a las 00:00** → lo hace la `api` al cambiar el día (ver ADR-008).
- **Alertas** → registros en la base visibles en el admin, sin canal de salida (ver ADR-017).
- **Sandbox de ejecución en la API** → no existe: la `api` nunca ejecuta código.

## Reglas de Implementación

- Los servicios MUST ser exactamente `web`, `admin`, `api` y `generator`, en `apps/web`, `apps/admin`, `apps/api` y `apps/generator`.
- `api` MUST ser la única interfaz HTTP del backend. `generator` MUST NOT abrir ningún puerto ni exponer endpoints.
- `api` MUST NOT ejecutar código (no `child_process`, `vm`, `eval` ni equivalentes) y MUST NOT llamar a APIs externas (ADR-017).
- `generator` MUST ser el único proceso que hace `INSERT` en `challenges`, `terms` y `timeline_facts`.
- `web` y `admin` MUST hablar solo con `api` (más Plausible en `web`, si está activo). MUST NOT acceder a la base.
- MUST NOT agregarse Redis, RabbitMQ, Kafka, BullMQ ni ningún broker en v1.
- Debe haber una sola instancia de `api` en v1. Las caches y el rate limit en memoria dependen de eso (ADR-012).

## Consecuencias

### Positivas
- Poca infraestructura: 2 procesos de backend y una base. Operable por una sola persona.
- La carga pesada (toolchains, ejecución) queda aislada del camino del jugador.
- La `api` queda simple y rápida, sin superficie de sandbox.
- Las fronteras de servicio siguen a los contextos del dominio: cada contexto tiene un dueño claro.

### Negativas
- La `api` concentra 4 contextos. Hay que mantener los módulos internos ordenados para que no se acoplen.
- Una sola instancia de `api`: no hay alta disponibilidad (aceptado, sin SLA).
- `api` y `generator` comparten la base, así que un cambio de schema afecta a los dos.

### Riesgos
- **Riesgo:** la `api` crece sin orden interno.
  - **Mitigación:** módulos por contexto dentro de `apps/api` y reglas de juego fuera de la `api`, en `games/*` (ADR-006).
- **Riesgo:** hace falta escalar la `api` horizontalmente.
  - **Mitigación:** las caches y el rate limit pasan a Postgres o Redis (NFR-SC03, post-MVP). Ninguna otra parte depende de la instancia única.

## Alternativas Consideradas

### Alternativa 1: Monolito único (api + generator en un proceso)

**Pros:**
- Un solo deploy y un solo proceso.

**Contras:**
- La imagen de la `api` cargaría Node, Go y JDK.
- La ejecución de snippets compartiría el event loop con las partidas.
- La `api` tendría `GENERATOR_SECRET`, y con él se podrían predecir los desafíos.

**Por qué se descartó:** mezcla dos cargas de trabajo opuestas y rompe el aislamiento del secreto del seed.

---

### Alternativa 2: Microservicios por contexto (identity, gameplay, progress, quality, content…)

**Pros:**
- Fronteras explícitas y deploy independiente.

**Contras:**
- Gameplay y Progress tienen que actualizarse en la misma transacción. Separarlos obliga a consistencia eventual.
- Mucha más infraestructura (red interna, bus, observabilidad distribuida) para una persona y ~1.000 jugadores.

**Por qué se descartó:** sobre-ingeniería para la escala y el equipo, y rompe la transaccionalidad que piden las rachas.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Mapa de Servicios, Servicios eliminados / fusionados, Arq-1
- `docs/discovery/analisis-dominio.md` — Contextos Delimitados
- `docs/prd/architecture.md`
