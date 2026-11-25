# ADR-014: Métricas en la base (sin analítica web)

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** métricas, privacidad, admin
**Actualizado:** 2026-11-15 (REQ-011) — se retiró la analítica web (Plausible); ver «Historial»

## Contexto

El PRD define métricas de seguimiento sin meta:
- jugadores diarios (total y por juego);
- retorno D1/D7;
- distribución de rachas;
- tasa de completado y % de victorias por desafío;
- reportes y anulaciones;
- clicks en compartir.

Todas menos los shares salen de datos que ya están en la base.

Las restricciones de privacidad son: sin cookies de terceros y sin banner (NFR-PR01, NFR-PR02).

Originalmente el usuario pidió Plausible Community Edition self-hosted, integrado desde v1 pero apagado por defecto (decisión #30), solo para medir los clicks en compartir. En REQ-011 el usuario decidió retirarlo: con un único evento propio (`share:<game_id>`) no justifica el script, el flag ni el mantenimiento.

## Decisión

**Métricas de producto desde PostgreSQL:** cuatro vistas en `@nerdose/db` que se leen con `GET /api/admin/metrics?from&to` y se muestran en la sección Métricas del admin como tablas HTML:

| Vista | Definición |
|---|---|
| `metrics_daily_players` | Jugadores distintos con alguna Play iniciada, por fecha (total con `game_id = null` y por juego) |
| `metrics_retention` | Cohorte por fecha de la primera Play completada; `d1`/`d7` = % con una Play completada en cohorte+1 / cohorte+7 |
| `metrics_streak_distribution` | Jugadores por tramo de `global_streak` vivo: `0`, `1`, `2-6`, `7-29`, `30+` |
| `metrics_challenge_quality` | Por challenge: `started` (Play creadas), `finished` (won + lost), `completion_rate`, `win_rate`, `reports`, `status` |

**Sin analítica web en v1:** ni `web` ni `admin` cargan scripts de analítica de terceros ni registran eventos de uso. Los clicks en compartir no se miden.

## Reglas de Implementación

- Las vistas MUST llamarse exactamente `metrics_daily_players`, `metrics_retention`, `metrics_streak_distribution` y `metrics_challenge_quality`, y MUST definirse en migraciones de `@nerdose/db`.
- El rol `nerdose_api` MUST tener solo `SELECT` sobre las vistas `metrics_*`.
- En `metrics_challenge_quality`, `completion_rate = finished / started` y `win_rate = won / finished`. Ambas MUST ser `null` si el divisor es 0.
- Las Play `voided` MUST NOT contar en `finished` ni en `win_rate`.
- El admin MUST mostrar las métricas como tablas HTML. MUST NOT agregarse librería de gráficos en v1.
- `web` y `admin` MUST NOT cargar scripts de analítica ni de tracking de terceros, ni enviar eventos de uso. Sumar analítica requiere un ADR nuevo.
- **Nota de implementación (REQ-011):** las vistas no dependen de "hoy". `metrics_retention` expone conteos (`d1_players`, `d7_players`) y `metrics_streak_distribution` el tramo de la racha guardada con `last_active_date`; la `api` completa `d1`/`d7` y la racha viva con su reloj y con `isStreakAlive` de core (ADR-011), para no duplicar la regla en SQL y poder probarla con relojes falsos.

## Consecuencias

### Positivas
- Las métricas son exactas, no dependen de bloqueadores y no requieren otro servicio.
- Las métricas del admin no dependen de ningún servicio externo de analítica.
- Sin scripts de terceros: menos superficie de privacidad y nada que configurar en el build.

### Negativas
- Los clicks en compartir, las pageviews y los orígenes del tráfico no se miden en v1.
- Las vistas se calculan al consultar. Con más volumen pueden necesitar vistas materializadas.

### Riesgos
- **Riesgo:** las vistas se vuelven lentas a medida que crece `plays`.
  - **Mitigación:** índices por `date` y `challenge_id`, y pasar a vistas materializadas si hace falta.

## Alternativas Consideradas

### Alternativa 1: Solo Plausible (o similar) para todas las métricas

**Pros:**
- Dashboards ya hechos.

**Contras:**
- Inexacto con bloqueadores, y no ve rachas ni calidad por desafío.

**Por qué se descartó:** las métricas de producto ya están en la base, con exactitud.

---

### Alternativa 2: Plausible Cloud desde el día 1

**Pros:**
- Sin instalación.

**Contras:**
- Costo de SaaS.

**Por qué se descartó:** decisión del usuario (#30).

---

### Alternativa 3: Plausible self-hosted detrás de un flag de build, apagado por defecto

Fue la decisión original (decisión #30): helper `track()` en `@nerdose/ui`, flags `VITE_PLAUSIBLE_DOMAIN` / `VITE_PLAUSIBLE_SCRIPT_URL` y evento `share:<game_id>`.

**Pros:**
- Medía los clicks en compartir y las visitas sin cookies.

**Contras:**
- Un solo evento propio; un servicio más que instalar y operar; flag y validación de build que mantener.

**Por qué se retiró:** decisión del usuario en REQ-011 (story S-058 elimina el código existente).

## Referencias

- `docs/discovery/analisis-tecnico.md` — Analítica opcional (Plausible), F11 (métricas), F13, Arq-19
- `docs/prd/requirements.md` — F-13, F-16 (retirada en v1), NFR-PR02

## Historial

- 2026-11-03: Accepted con métricas en la base y analítica web opcional con Plausible (decisión #30).
- 2026-11-15 (REQ-011): se retira la analítica web por decisión del usuario. Se eliminan las reglas de `track()`, `VITE_PLAUSIBLE_*` y `share:<game_id>`; se agrega la nota de implementación de las vistas.
