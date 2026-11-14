---
date: 2026-11-14
type: technical-change
service: admin, core, api (+ flujo regenerar-desafio, ADR-006)
---

# Cambio Técnico: admin, core, api — alinear la documentación con lo implementado en REQ-008

## Requerimiento Original

> Corregir documentación técnica tras REQ-008: (1) docs/flows/regenerar-desafio.md y REQ-008 usan `ON CONFLICT ON CONSTRAINT uq_generation_requests_pending`, inválido porque es índice parcial; el código usa `ON CONFLICT (challenge_id) WHERE status = 'pending'`. (2) Actualizar ADR-006 (culprits, bankUsage, Preview), convención game-clients del admin (todavía muestra I18nextProvider y md:), convención game-registry de core (falta bankUsage) y agregar sección REQ-008 en docs/architectures/core/overview.md.

## Resumen

Solo cambia la documentación; el código ya estaba bien. El flujo `regenerar-desafio` y REQ-008 tenían un `ON CONFLICT ON CONSTRAINT` que PostgreSQL rechaza, porque `uq_generation_requests_pending` es un índice único parcial y no una constraint. Ahora usan la inferencia por columna y predicado, igual que la implementación de S-037.

Además se documentan las extensiones del contrato `GameDefinition` que no estaban escritas: `culprits` (REQ-007), `bankUsage` (REQ-008) y `Preview` en `./client` (REQ-008). También se reescribe la convención de previews del admin según lo implementado en S-039.

## Documentos Modificados

| Documento | Cambio |
|-----------|--------|
| `docs/flows/regenerar-desafio.md` | El paso 1 pasa a `ON CONFLICT (challenge_id) WHERE status = 'pending' DO NOTHING`, con una nota sobre el error `42704` y el equivalente en Drizzle. |
| `docs/requests/REQ-008.admin-operacion-contenido.md` | La misma corrección en el diseño de `POST /api/admin/challenges/{id}/regenerate`. |
| `docs/adrs/ADR-006-contrato-gamedefinition.md` | El contrato suma `bankUsage`, `culprits`, `Culprit`, `BankUsage` y `Preview`. Hay reglas nuevas para los tres y se actualizan las consecuencias. Sigue `Accepted`. |
| `docs/architectures/admin/conventions/game-clients.md` | Reescrita: registry `Partial` con `hasPreview()` y `previewComponent()`, `Panel` con breakpoint `lg:` y sin i18next ni `I18nextProvider`. Si el juego no tiene `Preview` o la preview falla, se muestra `PayloadBilingual`. |
| `docs/architectures/core/conventions/game-registry.md` | Secciones nuevas `Update (REQ-007)` (`culprits`) y `Update (REQ-008)` (`bankUsage`). |
| `docs/architectures/api/conventions/game-registry.md` | Las mismas secciones, para mantener la copia igual a la de `core`. |
| `docs/architectures/core/overview.md` | Sección nueva `Update (REQ-008)`: `BankUsage`, `GENERATION_REQUEST_STATUSES` y `Preview`. |
