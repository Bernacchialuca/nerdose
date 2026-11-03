# ADR-014: Métricas en la base y analítica web opcional

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** métricas, analítica, privacidad, admin

## Contexto

El PRD define métricas de seguimiento sin meta:
- jugadores diarios (total y por juego);
- retorno D1/D7;
- distribución de rachas;
- tasa de completado y % de victorias por desafío;
- reportes y anulaciones;
- clicks en compartir.

Todas menos los shares salen de datos que ya están en la base.

Las restricciones de privacidad son: sin cookies de terceros, sin banner y analítica sin cookies (NFR-PR01, NFR-PR02). El usuario quiere Plausible Community Edition self-hosted, integrado desde v1 pero **apagado por defecto** hasta que esté instalado (decisión #30).

## Decisión

**Métricas de producto desde PostgreSQL:** cuatro vistas en `@nerdose/db` que se leen con `GET /api/admin/metrics?from&to` y se muestran en la sección Métricas del admin como tablas HTML:

| Vista | Definición |
|---|---|
| `metrics_daily_players` | Jugadores distintos con alguna Play iniciada, por fecha (total con `game_id = null` y por juego) |
| `metrics_retention` | Cohorte por fecha de la primera Play completada; `d1`/`d7` = % con una Play completada en cohorte+1 / cohorte+7 |
| `metrics_streak_distribution` | Jugadores por tramo de `global_streak` vivo: `0`, `1`, `2-6`, `7-29`, `30+` |
| `metrics_challenge_quality` | Por challenge: `started` (Play creadas), `finished` (won + lost), `completion_rate`, `win_rate`, `reports`, `status` |

**Analítica web:** script de Plausible en `web` detrás del flag de build `VITE_PLAUSIBLE_DOMAIN`, con eventos `share:<game_id>`. Todo pasa por un helper `track(event)` de `@nerdose/ui`.

## Reglas de Implementación

- Las vistas MUST llamarse exactamente `metrics_daily_players`, `metrics_retention`, `metrics_streak_distribution` y `metrics_challenge_quality`, y MUST definirse en migraciones de `@nerdose/db`.
- El rol `nerdose_api` MUST tener solo `SELECT` sobre las vistas `metrics_*`.
- En `metrics_challenge_quality`, `completion_rate = finished / started` y `win_rate = won / finished`. Ambas MUST ser `null` si el divisor es 0.
- Las Play `voided` MUST NOT contar en `finished` ni en `win_rate`.
- El admin MUST mostrar las métricas como tablas HTML. MUST NOT agregarse librería de gráficos en v1.
- `web` MUST llamar solo a `track(event)` de `@nerdose/ui`. MUST NOT referenciar `window.plausible` fuera de ese helper.
- Si `VITE_PLAUSIBLE_DOMAIN` está vacío, el build MUST NOT inyectar el script de Plausible y `track()` MUST ser un no-op.
- Si `VITE_PLAUSIBLE_DOMAIN` tiene valor, `VITE_PLAUSIBLE_SCRIPT_URL` MUST ser obligatoria (el build falla si falta), y el script MUST inyectarse con `defer` y `data-domain`.
- El evento de share MUST llamarse exactamente `share:<game_id>` (por ejemplo `share:devdle`) y MUST NOT llevar propiedades personalizadas.
- `admin` MUST NOT cargar analítica.

## Consecuencias

### Positivas
- Las métricas son exactas, no dependen de bloqueadores y no requieren otro servicio.
- La plataforma funciona igual con la analítica apagada. Las métricas del admin no dependen de Plausible.
- Activar Plausible no toca el código de los juegos.

### Negativas
- Los clicks en compartir solo se miden con Plausible activo.
- Cambiar el flag requiere un build y un deploy nuevos.
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

**Por qué se descartó:** decisión del usuario (#30). La URL del script es configurable, así que se puede apuntar al plan cloud sin cambiar código.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Analítica opcional (Plausible), F11 (métricas), F13, Arq-19
- `docs/prd/requirements.md` — F-13, F-16, NFR-PR02
