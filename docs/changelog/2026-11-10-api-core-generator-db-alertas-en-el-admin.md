---
date: 2026-11-10
type: technical-change
service: api, core, generator, db
---

# Cambio Técnico: api, core, generator, db — Alertas registradas en el admin en lugar de mail

## Requerimiento Original

> Reemplazar las alertas por mail (SMTP/nodemailer, ADR-013, notify() en core) por alertas registradas en la base y visibles en el admin. FG-6/C-37: al alcanzar el umbral de reportes se marca challenges.alerted_at (renombrar alert_sent_at) y la sección Reportes del admin lo muestra destacado. FG-7/C-49: la falla de generación crea la fila en generation_failures (una por juego y fecha, attempts + last_reason) y se ve en Próximos desafíos del admin; quitar generation_failures.alert_sent_at. Sin mail ni webhooks en v1. El PRD (docs/prd/*) ya fue actualizado.

## Resumen

En v1 las alertas dejan de enviarse por mail: son registros en la base que el admin muestra. El umbral de reportes marca `challenges.alerted_at` una sola vez, y la falla de generación es la fila de `generation_failures`. Se eliminan nodemailer, la entrada `@nerdose/core/notify`, la convención `alerts-mail` y los secretos `SMTP_*` / `ALERT_EMAIL_*`. El ADR-017 reemplaza al ADR-013.

## Cambios de Convenciones

| Convención | Cambio |
|---|---|
| Alertas por mail (notify) | eliminada (api, core, generator); se borra el archivo custom |
| Configuración de entorno | custom editada (api, db, generator): sin `SMTP_*`/`ALERT_EMAIL_*`; documenta `REPORT_ALERT_*` |
| Testing | custom editada (api, core, db, games, generator): sin stub de `notify()` |
| Manejo de errores | custom editada (api, core, db, games, generator): sin regla de envío fallido |
| Día de la plataforma | custom editada (api, core): la alerta es `alerted_at` en la transacción del reporte |
| http-server (api), scheduler-jobs y challenge-generation (generator) | custom editadas: sin mail ni SMTP |
| monorepo-tooling (workspace), game-package (games) | custom editadas: sin límites de lint de `@nerdose/core/notify` |

En `core` además se quita el módulo `notify` del manifest.

## Documentos Modificados

| Documento | Cambio |
|-----------|--------|
| `docs/adrs/ADR-013-alertas-por-mail.md` | Estado → Superseded by ADR-017 |
| `docs/adrs/ADR-001`, `ADR-002`, `ADR-003`, `ADR-007`, `ADR-016` | Sin `notify()`, nodemailer, entrada `./notify` ni salida SMTP |
| `docs/adrs/ADR-004-postgresql-unica-base-con-roles.md` | `alerted_at`; `nerdose_api` puede leer `generation_failures` |
| `docs/db-schemas/nerdose-db.md` | `challenges.alert_sent_at` → `alerted_at`; `generation_failures` sin `alert_sent_at`; GRANTs |
| `docs/apis/api.yaml` | Reporte marca `alerted_at` sin mail; `ReportGroup.alerted_at` (alertados primero); `UpcomingDay.games[].failure` |
| `docs/flows/reporte-de-problema.md`, `docs/flows/generacion-diaria.md` | Sin participante SMTP; la alerta se ve en el admin |
| `docs/architectures/{api,core,generator,ui}/overview.md` | Sin mail, nodemailer ni `notify` |
| `docs/architectures/{api,core,generator}/manifest.yaml` e `index.md` | Sin `alerts-mail` |
| `docs/ux/surfaces/admin/{product-map,user-flows}.md`, `docs/ux/audiences/responsable/research-context.md`, `docs/ux/cross-surface-flows.md` | La entrada al admin es por rutina; las alertas solo existen en el admin (sin tocar wireframes) |

## Nuevos ADRs

- `docs/adrs/ADR-017-alertas-registradas-en-el-admin.md` — Alertas registradas en la base y visibles en el admin

## Correcciones de Código (sin story, a pedido del usuario)

Implementadas directamente en lugar de crear stories correctivas:

- **S-015 (db):** migración `0003_rename_alerted_at` (`RENAME COLUMN alert_sent_at TO alerted_at`; el privilegio de columna de `nerdose_api` sigue a la columna), snapshot y journal; `publishing.ts` (`alertedAt`); tests de db actualizados y uno nuevo para la migración.
- **S-001 (workspace/ui):** se quitan de `eslint.config.js` la regla `noNotify` y el `ignores` de `packages/core/src/notify.ts`; se quitan los casos de `notify` de `test/eslint-boundaries.test.ts` y de `packages/ui/src/components/components.test.ts`.

Verificado: `drizzle-kit generate` no detecta más cambios; `pnpm lint` y `pnpm typecheck` pasan; tests de db (162), ui (145) y workspace (72) en verde.
