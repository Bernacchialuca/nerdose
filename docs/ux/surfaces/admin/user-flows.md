---
document: UX User Flows
surface: admin
version: "1.0"
date: 2026-11-03
status: Draft - Punto de partida para discusión
flows_count: 5
---

# User Flows — admin

> Flujos críticos internos de la superficie. **No son todos los flujos** —
> son los 3-5 que definen el valor del producto en esta superficie. Otros
> flujos derivan de estos o son operaciones secundarias. Si un flujo cruza
> a otra superficie, vive en `cross-surface-flows.md`, no acá.

> Todo lo que sigue es hipótesis hasta validar con el responsable. Los pasos se apoyan en las pantallas y overlays de `product-map.md` (P-01..P-05, O-01..O-03). Donde el PRD no define el comportamiento, se marca como supuesto o remite a una pregunta abierta del product-map.

## Flujos Documentados

| # | Flujo | JTBD que resuelve | Audiencia |
|---|-------|-------------------|-----------|
| 1 | Iniciar sesión y retomar tras sesión vencida | Habilitante de los tres JTBD (acceso con contraseña única y sesión de 8 h, C-38) | responsable |
| 2 | Revisar reportes y anular un desafío | JTBD 1: "Cuando me llega una alerta por reportes o reviso los reportes abiertos, quiero ver por desafío la solución, los textos ES/EN y los motivos, y poder anularlo si el error está confirmado" | responsable |
| 3 | Resolver o descartar reportes | JTBD 1 (misma cola, sin anular) | responsable |
| 4 | Revisar los próximos 14 días y regenerar un desafío | JTBD 2: "Cuando quiero anticipar problemas sin cargar nada a mano, quiero mirar los próximos 14 días y el stock, y regenerar un desafío si hace falta" | responsable |
| 5 | Consultar stock y métricas | JTBD 2 (stock) y JTBD 3: "Cuando quiero saber si la plataforma se usa y si los desafíos funcionan, quiero consultar las métricas" | responsable |

---

## Flujo 1: Iniciar sesión y retomar tras sesión vencida

**JTBD que resuelve:** Habilitante, no es un JTBD propio: da acceso a los tres de la audiencia. `[fuente: PRD §F-11 C-38, NFR-S07]`
**Audiencia:** responsable ([research-context](../../audiences/responsable/research-context.md))
**Trigger:** El responsable abre `admin.nerdose.dev` (típicamente desde el link de una alerta por mail, hipótesis `inferida-PRD`) sin sesión válida, o una petición devuelve `401` por token vencido (8 h).

### Happy path

1. Cualquier ruta sin token redirige a P-01 (Login).
2. El responsable ingresa la contraseña única y envía.
3. El sistema emite el token (8 h) y lo guarda en `sessionStorage`.
4. Redirige a P-02 (Reportes), destino por defecto de `/`.

### Caminos alternativos

- **Sesión vencida durante el uso** — Una petición devuelve `401`; se borra el token y se redirige a P-01 con el aviso "La sesión venció, ingresá de nuevo". Tras ingresar, el login lleva a P-02 (no vuelve a la ruta anterior; ver pregunta abierta 3 del product-map).
- **Cerrar sesión voluntariamente** — Acción "Cerrar sesión" del encabezado: borra el token y va a P-01.
- **Entrada por link directo a una ruta interna** — Sin token redirige a P-01; el retorno a esa ruta tras el login no está definido (pregunta abierta 3).

### Errores y recuperación

- **Contraseña incorrecta** — P-01 informa que la credencial es inválida sin revelar más detalle y deja reintentar. Recuperación: reintentar; el contador de intentos corre por IP.
- **Bloqueo por límite (5 intentos por IP en 15 min)** — P-01 informa el bloqueo temporal y deshabilita el envío. Recuperación: esperar la ventana; el mensaje debe indicar que es temporal. Supuesto: si debe mostrar el tiempo restante, no está definido en el PRD.
- **Vencimiento con un formulario abierto (O-01 o O-03)** — El `401` descarta el contexto y el motivo escrito. Recuperación: ingresar de nuevo y verificar el estado del desafío en P-02 antes de repetir la acción, porque la anulación puede haberse aplicado o no. Qué se conserva está abierto (pregunta abierta 3).
- **Error de red o API caída al enviar** — P-01 distingue "no se pudo conectar" de "contraseña incorrecta". Recuperación: reintentar sin consumir la sensación de intento fallido (supuesto a confirmar con arquitectura de `api`).

### Estado final

El responsable está en P-02 con el encabezado de navegación visible y el token vigente en `sessionStorage`. Si cerró sesión, está en P-01 sin token.

### Criterios de éxito

- El responsable ingresa con un solo campo y un solo envío.
- Entiende por el aviso por qué volvió al login (sesión vencida vs bloqueo vs contraseña inválida) sin ambigüedad.
- Tras un vencimiento, sabe que debe verificar el estado de lo que estaba haciendo antes de repetirlo.

---

## Flujo 2: Revisar reportes y anular un desafío

**JTBD que resuelve:** "Cuando me llega una alerta por reportes o reviso los reportes abiertos, quiero ver por desafío la solución, los textos ES/EN y los motivos, y poder anularlo si el error está confirmado, para que un error del generador no afecte las rachas de los jugadores." `[fuente: PRD §F-11 C-39, C-41]`
**Audiencia:** responsable ([research-context](../../audiences/responsable/research-context.md))
**Trigger:** Alerta por mail por umbral de reportes (C-49) o revisión de rutina de P-02.

### Happy path

1. Con sesión activa, el responsable entra a P-02 (Reportes). Ve grupos por desafío, el más reportado primero, con filtro en `open` por defecto.
2. Abre un grupo (fila) y se despliega O-02 (Detalle del desafío): preview del `client` en modo solución, ES y EN lado a lado, log de verificación, y motivos, mensajes y contexto de cada reporte.
3. Concluye que el error es real y pulsa "Anular". Se abre O-01 (Anular desafío).
4. Completa `void_reason` (obligatorio) y elige el culpable: `term`, `timeline_fact`, `template` o `none`. Si es `term` o `timeline_fact`, indica el `id` (obligatorio).
5. O-01 muestra el resumen de consecuencias irreversibles: el desafío deja de aceptar jugadas y muestra el mensaje de anulación, las Play pasan a `voided`, los reportes abiertos pasan a `resolved`, el culpable pasa a `rejected` si es término o hecho, y se recalculan los agregados de los jugadores. `[fuente: PRD C-41]`
6. El responsable confirma. El sistema ejecuta la anulación.
7. P-02 se actualiza: el grupo sale de la cola de abiertos (sus reportes quedaron `resolved`).

### Caminos alternativos

- **Anular desde la fila sin abrir el detalle** — La acción "Anular" del grupo abre O-01 directamente (product-map O-01). Se pierde la verificación visual previa; el flujo recomendado pasa por O-02.
- **Culpable `none` o `template`** — Sin `id`; no se rechaza ningún término ni hecho.
- **El error no se confirma** — El responsable no anula y pasa al Flujo 3 (resolver o descartar).
- **Revisar desafíos ya resueltos o descartados** — Cambiar el filtro de estado para consultar el historial; sin acciones de anulación si el desafío ya no está `published`.

### Errores y recuperación

- **Desafío no `published`** — La acción "Anular" no está disponible (C-41 solo admite `published`). El control se muestra deshabilitado con el motivo; recuperación: nada que anular (por ejemplo ya está `voided`).
- **Falta `void_reason` o `id` del culpable** — O-01 bloquea la confirmación y marca el campo faltante. Recuperación: completar.
- **Confirmación enviada pero la respuesta falla (red, 5xx)** — Por ser irreversible, el reintento es el riesgo. Recuperación: O-01 informa el error, no reenvía solo; el responsable recarga P-02 y verifica el estado del desafío antes de reintentar. Supuesto: la API rechaza anular un desafío ya anulado; a confirmar en arquitectura de `api`.
- **Sesión vencida con O-01 abierto** — Ver Flujo 1; se pierde el motivo escrito. Pregunta abierta 3 del product-map.
- **Elegir culpable equivocado** — No hay deshacer. Por eso el resumen de consecuencias previo a confirmar es parte obligatoria del flujo. Cómo se corrige un culpable mal elegido no está definido en el PRD (supuesto: fuera de la superficie, a validar).
- **Carga del detalle falla (O-02)** — Se muestra el error en el drawer con reintento; no se habilita "Anular" sin ver el desafío (hipótesis, a validar).

### Estado final

El grupo desaparece de la cola de abiertos en P-02 y aparece bajo "resueltos" si se cambia el filtro. El desafío queda `voided`; los jugadores ven el mensaje de anulación y su racha no se ve afectada.

### Criterios de éxito

- El responsable decide si anula sin salir de P-02 ni consultar otra fuente (solución, ES/EN, motivos y contexto en un solo lugar). `[fuente: benchmark - Modqueue de Reddit, a evitar]`
- Ve las consecuencias irreversibles antes de confirmar. `[fuente: benchmark - Django admin, a evitar]`
- No ejecuta la anulación dos veces por un error de red.

---

## Flujo 3: Resolver o descartar reportes

**JTBD que resuelve:** "Cuando reviso los reportes abiertos, quiero cerrar los que no ameritan anular, para dejar la cola solo con lo pendiente." (JTBD 1, parte de la cola) `[fuente: PRD §F-11 C-39, C-40]`
**Audiencia:** responsable ([research-context](../../audiences/responsable/research-context.md))
**Trigger:** Revisión de P-02 donde el desafío reportado no tiene error confirmado, o el problema ya fue atendido fuera del admin.

### Happy path

1. En P-02 (filtro `open`), el responsable abre un grupo con O-02 y lee solución, ES/EN y motivos.
2. Decide que no hay error en el desafío: elige "Descartar". Si el reporte era válido y ya se corrigió o atendió, elige "Resolver".
3. El sistema pasa el reporte a `dismissed` o `resolved` (estados terminales, solo desde `open`).
4. El reporte sale de la cola de abiertos y el contador del encabezado baja (si se mantiene; pregunta abierta 1).

### Caminos alternativos

- **Cerrar varios reportes del mismo desafío** — Se actúa sobre cada reporte del grupo; si resolver/descartar en bloque por grupo existe no está definido en el PRD (C-40 es por reporte). A validar.
- **Reportes en el mismo desafío con distinto veredicto** — Algunos se descartan y otros se resuelven; el grupo permanece en `open` hasta que no queden reportes abiertos.
- **Cola sin abiertos** — P-02 muestra "no hay reportes abiertos" distinto de un error de carga.
- **Cambia de decisión y quiere anular** — Si el desafío sigue `published`, anula (Flujo 2) antes de cerrar los reportes; anular resuelve los abiertos automáticamente.

### Errores y recuperación

- **Reporte ya no está `open`** (cerrado en otra pestaña o por una anulación) — La API rechaza la transición. P-02 refresca el grupo y muestra su estado actual. Recuperación: ninguna acción pendiente.
- **Cierre por error** — Los estados son terminales; no hay reabrir. Recuperación: ninguna en la superficie; el filtro de resueltos/descartados permite ver qué se cerró. Supuesto: si una acción de descartar necesita confirmación no está definido; a validar con el responsable.
- **Falla de red al cerrar** — La fila conserva su estado y se informa el error con reintento; no se marca como cerrada hasta confirmar.
- **Sesión vencida** — Ver Flujo 1; tras ingresar, verificar la cola de abiertos.

### Estado final

Los reportes tratados quedan `resolved` o `dismissed` y visibles bajo su filtro; la cola de abiertos solo contiene lo pendiente.

### Criterios de éxito

- El responsable cierra un reporte en pocas acciones desde O-02 sin cambiar de pantalla.
- La acción sobre cada reporte es inequívoca: ve cuál estado terminal elige y que no se puede revertir.
- La cola `open` queda sin ítems ya tratados.

---

## Flujo 4: Revisar los próximos 14 días y regenerar un desafío

**JTBD que resuelve:** "Cuando quiero anticipar problemas sin cargar nada a mano, quiero mirar los próximos 14 días y regenerar un desafío si hace falta, para detectar un hueco o un desafío dudoso antes de su fecha." `[fuente: PRD §F-12 C-43, C-44]`
**Audiencia:** responsable ([research-context](../../audiences/responsable/research-context.md))
**Trigger:** Alerta por mail de falla de generación (C-49) o revisión de rutina; también un reporte previo que hace dudar de un desafío futuro similar (hipótesis).

### Happy path

1. El responsable entra a P-03 (Próximos desafíos) desde el encabezado ("Próximos").
2. Ve la grilla de 14 días × 5 juegos con el estado de cada celda: aprobado, sin desafío o regeneración pendiente.
3. Abre una celda aprobada que le parece dudosa: O-02 muestra la preview en modo solución, ES/EN y log de verificación.
4. Pulsa "Regenerar". Se abre O-03 que pide confirmar (solo `approved` con fecha posterior a hoy).
5. Confirma. La celda pasa a "regeneración pendiente" y P-03 hace polling (5 s sugerido, a confirmar).
6. El reemplazo pasa la verificación: la celda vuelve a "aprobado" con el desafío nuevo (el viejo pasa a `rejected`, de forma atómica).

### Caminos alternativos

- **Revisión sin intervención** — Recorre la grilla, no ve huecos ni dudas y sale. Es el caso esperado la mayoría de los días (hipótesis `inferida-PRD`).
- **Celda sin desafío** — No admite "Regenerar" (C-44 solo aplica a `approved`). Se detecta el hueco y se actúa fuera de esta superficie; la superficie no define acción para completarlo (ver riesgo abajo).
- **Regenerar desde la celda sin abrir el detalle** — Acción directa que abre O-03 (product-map O-03).
- **Salir de la pantalla durante la regeneración** — El proceso sigue en el servidor; al volver a P-03 el estado pendiente se retoma por el polling.

### Errores y recuperación

- **La regeneración falla o el reemplazo no pasa la verificación** — Queda el desafío actual `approved` (C-44). P-03 quita el estado pendiente e informa que no se pudo regenerar. Recuperación: reintentar o dejar el actual.
- **Fecha ya no es futura o el desafío dejó de ser `approved`** — O-03 no permite confirmar y explica por qué. Recuperación: refrescar P-03.
- **Regeneración ya pendiente en esa celda** — "Regenerar" no está disponible; el responsable espera el resultado.
- **Falla al cargar la grilla o las previews** — P-03 distingue error de carga de "sin datos" con reintento; las previews se renderizan al abrir O-02 (pregunta abierta 5).
- **Sesión vencida durante el polling o con O-03 abierto** — Ver Flujo 1; al volver, P-03 muestra el estado real de cada celda.
- **Hueco de generación sin vía de resolución en la superficie** — El PRD permite ver los días sin desafío (C-43) pero no ofrece acción para crearlos desde el admin; es un riesgo de recuperación abierto. A confirmar con el responsable.

### Estado final

La grilla refleja que cada celda dudosa fue reemplazada (desafío nuevo aprobado) o que se dejó el actual. No quedan celdas en "regeneración pendiente" salvo las en curso.

### Criterios de éxito

- Detecta de un vistazo qué días de los próximos 14 quedan sin desafío en cada juego. `[fuente: PRD §F-12 C-43]`
- Puede revisar un desafío futuro (solución, ES/EN, log) sin cargar nada a mano.
- Una regeneración fallida nunca deja una celda sin desafío.

---

## Flujo 5: Consultar stock y métricas

**JTBD que resuelve:** JTBD 2 (stock): "mirar el stock de contenido de los bancos" `[fuente: PRD §F-12 C-45]`; JTBD 3: "Cuando quiero saber si la plataforma se usa y si los desafíos funcionan, quiero consultar las métricas de uso, retención y calidad por desafío, para decidir si hay algo que revisar." `[fuente: PRD §F-13 C-46]`
**Audiencia:** responsable ([research-context](../../audiences/responsable/research-context.md))
**Trigger:** Revisión de rutina (frecuencia desconocida, ver "Lo que NO sabemos") o seguimiento de una alerta de stock o de un hueco visto en P-03.

### Happy path

1. El responsable abre P-04 (Stock de contenido) desde el encabezado.
2. Ve por banco (términos, hechos): ítems aprobados disponibles y totales, rechazados con motivo, días de stock estimados, si el banco alcanza para ciclar respetando la ventana anti-repetición, y la última carga del dataset. Además el top 50 de palabras rechazadas en Devdle.
3. Concluye que el stock es suficiente y abre P-05 (Métricas).
4. Elige el rango de fechas (`from`, `to`). Ve cifras resumen y tablas: jugadores únicos, retención D1/D7, distribución de rachas, calidad por desafío.
5. Identifica un desafío con tasa de completado baja o reportes altos y decide si revisarlo (ver camino alternativo).

### Caminos alternativos

- **Solo métricas** — Entra directo a P-05 sin pasar por P-04.
- **Un desafío de baja calidad** — La fila de calidad no enlaza hoy a Reportes ni al desafío (pregunta abierta 6). El responsable va a P-02 manualmente para investigar. Supuesto: si debe haber enlace, depende de la respuesta a esa pregunta.
- **Banco por agotarse** — P-04 muestra días de stock bajos o que no alcanza para ciclar; la acción es externa a la superficie (solo lectura, C-45). Alimenta el Flujo 4 si empiezan a aparecer huecos.
- **Cambiar el rango** — Reconsultar con otro rango; todas las tablas lo respetan.

### Errores y recuperación

- **Rango inválido** (`from` > `to`, o vacío) — P-05 marca el campo y no consulta. Recuperación: corregir el rango.
- **Rango sin Play** — Muestra "sin datos en el rango", distinto de error de carga. Recuperación: ampliar el rango.
- **Error de carga o API caída** — Cada pantalla muestra el error con reintento, sin mostrar cifras viejas como actuales.
- **Sesión vencida** — Ver Flujo 1; tras ingresar, el rango elegido se pierde (el login lleva a P-02).
- **Cifra que no cuadra con lo que el responsable espera** — La definición de cada métrica (cohorte, tramos de rachas) debe ser visible en la tabla. Si no basta, no hay otra fuente dentro de la superficie. A validar.

### Estado final

El responsable sabe si el stock alcanza y cómo se comportan uso, retención y calidad en el rango, y decide si hay algo que revisar (en P-02, P-03 o fuera del admin). No cambia ningún dato en el sistema (solo lectura).

### Criterios de éxito

- Ve el estado de cada banco y si alcanza para ciclar sin hacer cuentas. `[fuente: PRD §F-12 C-45]`
- Elige un rango y ve cifras resumen antes del detalle. `[fuente: benchmark - Plausible Analytics]`
- Distingue sin ambigüedad "sin datos" de "error de carga".

---

**Relacionados:** Las pantallas usadas en estos flujos están inventariadas en `product-map.md` de esta superficie. Los flujos que cruzan a otras superficies viven en `../cross-surface-flows.md`.
