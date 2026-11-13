---
document: UX Cross-Surface Flows
version: "1.2"
date: 2026-11-13
status: Draft - Punto de partida para discusión
flows_count: 2
---

# Flujos Cross-Surface — nerdose

> Flujos que **cruzan superficies**. No pertenecen a ninguna superficie en
> particular: una acción en una superficie dispara un cambio o notificación
> en otra. Si el flujo es interno a una sola superficie, vive en
> `surfaces/{nombre}/user-flows.md`, no acá.

## Flujos Cross-Surface Documentados

| # | Flujo | Superficies | Audiencias |
|---|-------|-------------|------------|
| 1 | Reporte del jugador hasta la anulación del desafío | web → admin → web | jugador, responsable |
| 2 | Regeneración de un desafío próximo | admin → web (indirecto, al publicarse) | responsable, jugador |

## Flujo 1: Reporte del jugador hasta la anulación del desafío

**Superficies involucradas:**
1. web — origen del reporte (C-36) y destino del aviso de anulación (C-08, C-42)
2. admin — donde se revisan los reportes y se decide anular (C-39 a C-41)

**Audiencias involucradas:**
- jugador en web: reporta un problema durante la partida o en el resultado; después ve el desafío como anulado y puede marcarlo como completado.
- responsable en admin: revisa los reportes agrupados, confirma el error y anula el desafío.

**Secuencia:**

1. **[web]** El jugador abre el formulario de reporte (O-01) desde la partida o el resultado, elige el motivo y envía. El reporte queda `open` y el enlace pasa a "Ya reportaste este desafío".
2. **[admin]** El reporte aparece en `/reports`, agrupado por desafío: alertados primero, luego por cantidad y luego por fecha. Si se alcanza el umbral, el grupo queda marcado como alertado (C-37, ADR-017). No hay mail: la alerta solo existe en el admin, con el contador del encabezado.
3. **[admin]** El responsable abre el detalle del desafío (solución en ES y EN, log, motivos, mensajes), confirma el error y lo anula con motivo y culpable elegido de la lista del desafío. El admin confirma cuántas partidas se afectaron.
4. **[web]** Al abrir el juego, la home y la pantalla del juego muestran el estado "anulado" con el aviso "Este desafío tenía un error y fue anulado. Tu racha no se ve afectada". Si el jugador no tenía partida, puede tocar "Marcar como completado" (C-42); si ya había jugado, ve el resultado anulado (aviso + rachas, sin solución) con sus estadísticas recalculadas.
5. **[web]** Si el jugador tenía una partida en curso y hace una jugada, recibe `challenge_voided` y la pantalla pasa al estado anulado.

**Sincronización:**
- **Tipo:** Manual / bajo demanda: la web no recibe push; consulta el estado al cargar la home o el juego, o al hacer una jugada.
- **Latencia esperada:** hasta la próxima carga o jugada del jugador. El estado del lado del servidor cambia en el momento de anular.
- **Qué se comparte:** reporte (motivo, mensaje, contexto), alerta (`alerted_at`), estado del desafío (`published` → `voided`), Play pasadas a `voided`, agregados recalculados, ítem culpable `rejected`.
- **Implementado por:** REQ-007.

**Estados intermedios:**

- **jugador en web ve:** entre el reporte y la anulación, nada cambia: el desafío sigue `published` y puede seguir jugando (los reportes nunca despublican). Tras reportar, no puede reportar de nuevo ese desafío (`already_reported`).
- **responsable en admin ve:** el reporte `open` en `/reports` hasta resolverlo, descartarlo o anular; al anular, los reportes abiertos pasan a `resolved`.

## Flujo 2: Regeneración de un desafío próximo

**Superficies involucradas:**
1. admin — pide la regeneración (C-44) y ve el resultado con polling
2. web — recibe el desafío vigente de esa fecha cuando se publica (indirecto)

**Audiencias involucradas:**
- responsable en admin: mira los próximos 14 días y regenera un desafío aprobado (por duda, por una falla del contenido o porque usa un ítem rechazado).
- jugador en web: no ve el proceso; solo juega el desafío vigente el día correspondiente.

**Secuencia:**

1. **[admin]** En `/upcoming` el responsable regenera un desafío `approved` con fecha futura. La celda pasa a "regeneración pendiente"; el desafío actual sigue aprobado y publicable.
2. **[admin]** La vista consulta cada 5 s hasta que el reemplazo pasa la verificación (el nuevo queda aprobado y el viejo `rejected` en la misma operación) o falla (queda el actual, con el motivo visible).
3. **[admin → web]** Si llega la fecha antes de que se atienda el pedido, el pedido se cancela y se publica el desafío original sin cambios: nunca se reemplaza un desafío publicado.
4. **[web]** Llegado el día, la home y el juego muestran el desafío vigente de esa fecha, sin diferencia visible para el jugador.

**Sincronización:**
- **Tipo:** Polling en el admin (5 s, solo mientras hay pendientes); sin propagación hacia la web hasta la publicación (00:00 UTC).
- **Latencia esperada:** la del generador al atender el pedido (inmediata si está activo; al volver si estaba caído). La web no depende de ella.
- **Qué se comparte:** el Challenge `approved` de esa fecha (el nuevo o el original) y el estado del pedido (pendiente, atendido, fallido, cancelado).
- **Implementado por:** REQ-008.

**Estados intermedios:**

- **responsable en admin ve:** "regeneración pendiente" con el desafío actual visible hasta el reemplazo; después el nuevo, o "regeneración fallida" con su motivo. Un pedido cancelado por cambio de día no se muestra (el día ya salió de la ventana).
- **jugador en web ve:** nada: los desafíos futuros, su solución y su log nunca salen por los endpoints de jugador (NFR-S01).
