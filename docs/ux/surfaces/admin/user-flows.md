---
document: UX User Flows
surface: admin
version: "1.4"
date: 2026-11-25
status: Draft - Punto de partida para discusión
flows_count: 5
---

# User Flows — admin

> Flujos críticos internos de la superficie. **No son todos los flujos** —
> son los 3-5 que definen el valor del producto en esta superficie. Otros
> flujos derivan de estos o son operaciones secundarias. Si un flujo cruza
> a otra superficie, vive en `cross-surface-flows.md`, no acá.

> Todo lo que sigue es hipótesis hasta validar con el responsable. Los pasos se apoyan en las pantallas y overlays de `product-map.md` (P-01..P-06, O-01..O-03). Donde el PRD no define el comportamiento, se marca como supuesto o remite a una pregunta abierta del product-map.

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
**Trigger:** El responsable abre `admin.nerdose.dev` (por una revisión de rutina: no hay alertas por mail, ADR-017) sin sesión válida, o una petición devuelve `401` por token vencido (8 h).

### Happy path

1. Cualquier ruta sin token redirige a P-01 (Login).
2. El responsable ingresa la contraseña única y envía.
3. El sistema emite el token (8 h) y lo guarda en `sessionStorage`.
4. Redirige a P-02 (Reportes), destino por defecto de `/`.

### Caminos alternativos

- **Sesión vencida durante el uso** — Una petición devuelve `401 unauthorized` (token de más de 8 h, ausente o malformado); se borra el token, se limpian los datos en memoria y se redirige a P-01 con el aviso "La sesión venció, ingresá de nuevo". Tras ingresar, el login lleva a P-02 (no vuelve a la ruta anterior; pregunta abierta 3, resuelta por REQ-007). `[fuente: REQ-007 CA 13]`
- **Cerrar sesión voluntariamente** — Acción "Cerrar sesión" del encabezado: borra el token en el navegador y va a P-01 (no hay cierre de sesión en el servidor; el token igual vence a las 8 h).
- **Entrada por link directo a una ruta interna** — Sin token redirige a P-01; tras el login va a P-02.

### Errores y recuperación

- **Contraseña incorrecta** — P-01 informa que la credencial es inválida sin revelar más detalle y deja reintentar. Recuperación: reintentar; el contador de intentos corre por IP.
- **Bloqueo por límite (5 intentos por IP en 15 min)** — P-01 informa "Demasiados intentos. Probá de nuevo en N minutos." (del `Retry-After`) y deshabilita el envío hasta entonces; durante el bloqueo no se evalúa la contraseña, aunque sea la correcta. Recuperación: esperar. `[fuente: REQ-007 CA 12]`
- **Vencimiento con un formulario abierto (O-01 o O-03)** — El `401` descarta el contexto y el motivo escrito. Recuperación: ingresar de nuevo y verificar el estado del desafío en P-02 antes de repetir la acción, porque la anulación puede haberse aplicado o no. Qué se conserva está abierto (pregunta abierta 3).
- **Error de red o API caída al enviar** — P-01 distingue "no se pudo conectar" de "contraseña incorrecta". Recuperación: reintentar; un pedido que no llega a la API no cuenta como intento.

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
**Trigger:** Revisión de rutina de P-02; los desafíos que alcanzaron el umbral de reportes (C-37) aparecen marcados como alertados y primero.

### Happy path

1. Con sesión activa, el responsable entra a P-02 (Reportes). Ve grupos por desafío: los alertados primero (marcados "alertado"), luego los más reportados y luego los más recientes, con filtro en `open` por defecto; la lista se pagina de a 20 grupos («‹ Anterior · Siguiente ›», solo si hay más de una página; REQ-012). `[fuente: REQ-007 CA 14]`
2. Abre un grupo (fila) y se despliega O-02 (Detalle del desafío): la solución completa con sus textos en español (vista genérica del `payload`; desde REQ-012 el admin no muestra la versión en inglés), los datos del desafío, el log de verificación y cada reporte con motivo, mensaje, idioma, contexto y `player_ref`.
3. Concluye que el error es real y pulsa "Anular". Se abre O-01 (Anular desafío).
4. Completa `void_reason` (obligatorio, hasta 500 caracteres) y elige el culpable de una lista: los términos o hechos del propio desafío por nombre (`culprits`), "La plantilla del juego" o "Ninguno". No se tipea ningún id. `[fuente: REQ-007 decisión 3]`
5. O-01 muestra el resumen de consecuencias irreversibles: el desafío deja de aceptar jugadas y muestra el mensaje de anulación, las Play pasan a `voided`, los reportes abiertos pasan a `resolved`, el culpable pasa a `rejected` si es término o hecho, y se recalculan los agregados de los jugadores. `[fuente: PRD C-41]`
6. El responsable confirma. El sistema ejecuta la anulación en una sola operación (o se aplica completa o no se aplica nada).
7. P-02 se actualiza con el aviso "Devdle #8 anulado · N partidas afectadas": el grupo sale de la cola de abiertos (sus reportes quedaron `resolved`) y el contador baja.

### Caminos alternativos

- **Anular desde la fila sin abrir el detalle** — La acción "Anular" del grupo abre O-01 directamente (product-map O-01). Se pierde la verificación visual previa; el flujo recomendado pasa por O-02.
- **Culpable `none` o `template`** — Sin `id`; no se rechaza ningún término ni hecho.
- **El error no se confirma** — El responsable no anula y pasa al Flujo 3 (resolver o descartar).
- **Revisar desafíos ya resueltos o descartados** — Cambiar el filtro de estado para consultar el historial; sin acciones de anulación si el desafío ya no está `published`.

### Errores y recuperación

- **Desafío no `published`** — La acción "Anular" no está disponible (C-41 solo admite `published`). El control se muestra deshabilitado con el motivo; recuperación: nada que anular (por ejemplo ya está `voided`). Si cambió con O-01 abierto (otra pestaña), la API responde `not_voidable` y O-01 lo informa con su propio aviso. `[fuente: REQ-007 CA 22]`
- **Culpable que no corresponde al desafío (`invalid_culprit`)** — No debería pasar porque la lista sale del desafío; si pasa, O-01 pide elegir otro y no se aplica nada. `[fuente: REQ-007 CA 21]`
- **Falta `void_reason` o el culpable** — O-01 bloquea la confirmación y marca el campo faltante. Recuperación: completar.
- **Confirmación enviada pero la respuesta falla (red, 5xx)** — Por ser irreversible, el reintento es el riesgo. Recuperación: O-01 informa el error, no reenvía solo; el responsable recarga P-02 y verifica el estado del desafío antes de reintentar. La API rechaza anular un desafío ya anulado (`not_voidable`), así que el reintento no duplica efectos. `[fuente: REQ-007 CA 22, 23]`
- **Sesión vencida con O-01 abierto** — Ver Flujo 1; se pierde el motivo escrito. Pregunta abierta 3 del product-map.
- **Elegir culpable equivocado** — No hay deshacer. Por eso el culpable se elige por nombre y el resumen previo nombra el ítem que se rechaza. Cómo se corrige un culpable mal elegido no está definido en el PRD (supuesto: fuera de la superficie, a validar).
- **El ítem rechazado está en desafíos ya generados de los próximos días** — Esos desafíos no cambian (riesgo aceptado en REQ-007); O-01 lo advierte y se revisan en Próximos con FG-7.
- **Carga del detalle falla (O-02)** — Se muestra el error en el drawer con reintento; no se habilita "Anular" sin ver el desafío (hipótesis, a validar).

### Estado final

El grupo desaparece de la cola de abiertos en P-02 y aparece bajo "resueltos" si se cambia el filtro. El desafío queda `voided`; los jugadores ven el mensaje de anulación y su racha no se ve afectada.

### Criterios de éxito

- El responsable decide si anula sin salir de P-02 ni consultar otra fuente (solución, textos, motivos y contexto en un solo lugar; los textos solo en español desde REQ-012). `[fuente: benchmark - Modqueue de Reddit, a evitar]`
- Ve las consecuencias irreversibles antes de confirmar. `[fuente: benchmark - Django admin, a evitar]`
- No ejecuta la anulación dos veces por un error de red.

---

## Flujo 3: Resolver o descartar reportes

**JTBD que resuelve:** "Cuando reviso los reportes abiertos, quiero cerrar los que no ameritan anular, para dejar la cola solo con lo pendiente." (JTBD 1, parte de la cola) `[fuente: PRD §F-11 C-39, C-40]`
**Audiencia:** responsable ([research-context](../../audiences/responsable/research-context.md))
**Trigger:** Revisión de P-02 donde el desafío reportado no tiene error confirmado, o el problema ya fue atendido fuera del admin.

### Happy path

1. En P-02 (filtro `open`), el responsable abre un grupo con O-02 y lee solución, textos y motivos.
2. Para cada reporte decide: si no hay error en el desafío, "Descartar"; si el reporte era válido y ya se atendió, "Resolver".
3. El sistema pasa ese reporte a `dismissed` o `resolved` (estados terminales, solo desde `open`), sin tocar el desafío ni las partidas. El drawer sigue abierto con el resto. `[fuente: REQ-007 CA 15]`
4. Cuando no quedan reportes abiertos en el grupo, el grupo sale de la cola de abiertos y el contador del encabezado baja.

### Caminos alternativos

- **Cerrar varios reportes del mismo desafío** — Se actúa sobre cada reporte del grupo; no hay acción en bloque (C-40 es por reporte; REQ-007).
- **Reportes en el mismo desafío con distinto veredicto** — Algunos se descartan y otros se resuelven; el grupo permanece en `open` hasta que no queden reportes abiertos.
- **Cola sin abiertos** — P-02 muestra "no hay reportes abiertos" distinto de un error de carga.
- **Cambia de decisión y quiere anular** — Si el desafío sigue `published`, anula (Flujo 2) antes de cerrar los reportes; anular resuelve los abiertos automáticamente.

### Errores y recuperación

- **Reporte ya no está `open`** (cerrado en otra pestaña o por una anulación) — La API rechaza la transición (`report_not_open`). O-02 avisa "Este reporte ya estaba cerrado. Actualizamos la lista." y refresca. Recuperación: ninguna acción pendiente. `[fuente: REQ-007 CA 16]`
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

**JTBD que resuelve:** "Cuando quiero anticipar problemas sin cargar nada a mano, quiero mirar los próximos 14 días y regenerar un desafío si hace falta, para detectar un hueco o un desafío dudoso antes de su fecha." `[fuente: PRD §F-12 C-43, C-44, C-49]`
**Audiencia:** responsable ([research-context](../../audiences/responsable/research-context.md))
**Trigger:** Revisión de rutina de Próximos desafíos; el contador «Próximos (n)» del encabezado avisa que hay fallas de generación activas (C-49, sin mail por ADR-017); también un reporte o una anulación previa que hace dudar de un desafío futuro (REQ-007 dejó los desafíos que usan un ítem rechazado para revisarlos acá).

### Happy path

1. El responsable entra a P-03 (Próximos desafíos) desde el encabezado («Próximos», con el número de fallas activas si hay).
2. Ve la grilla de mañana a +14 días × juegos registrados con el estado de cada celda: aprobado, sin desafío (con su falla de generación), regeneración pendiente, regeneración fallida o «usa un ítem rechazado». Hoy no aparece. `[fuente: REQ-008 CA 1]`
3. Abre una celda aprobada que le parece dudosa con su tarjeta «Ver detalle ›»: O-02 muestra la preview del juego en modo solución (como la ve el jugador, con la solución superpuesta) en un solo panel «Vista previa» en español (REQ-012), el intento, la versión del generador y el log de verificación, sin el seed. `[fuente: REQ-008 CA 2]`
4. Pulsa «Regenerar» (solo está dentro de O-02 desde REQ-012). O-03 explica que el pedido se atiende en segundo plano y pide confirmar (solo `approved` con fecha posterior a hoy).
5. Confirma. La celda (y O-02 si está abierto) pasa a «regeneración pendiente»; el desafío actual sigue aprobado. P-03 hace polling cada 5 s. `[fuente: REQ-008 CA 3]`
6. El reemplazo pasa la verificación: la celda vuelve a «aprobado» con el desafío nuevo (el viejo pasa a `rejected` en la misma operación) y el polling se corta.

### Caminos alternativos

- **Revisión sin intervención** — Recorre la grilla, no ve huecos ni avisos y sale. Es el caso esperado la mayoría de los días (hipótesis `inferida-PRD`).
- **Desafío que usa un ítem rechazado** — La celda y O-02 muestran «Usa un ítem rechazado: <término o hecho>» y O-02 ofrece «Regenerar». No se regenera solo: el responsable decide. `[fuente: REQ-008 CA 10]`
- **Celda sin desafío por una falla de generación** — Muestra los intentos (20) y el último motivo, destacada, y el aviso de la sección la resume. No admite «Regenerar» (C-44 solo aplica a `approved`): la próxima corrida del generador lo reintenta. Cuando una corrida lo logra, la falla deja de mostrarse sola. `[fuente: REQ-008 CA 8, 9]`
- ~~**Regenerar desde la celda sin abrir el detalle** — Acción directa que abre O-03.~~ **Quitado en REQ-012 (S-068):** la celda solo abre el detalle; regenerar exige ver antes el desafío en O-02.
- **Pedir de nuevo con una regeneración pendiente** — «Regenerar» no está disponible; si un doble clic llega a la API, devuelve el pedido existente y no se crea otro. `[fuente: REQ-008 CA 4]`
- **Salir de la pantalla durante la regeneración** — El pedido sigue en el servidor; al volver a P-03 la celda muestra su estado real y el polling se retoma si sigue pendiente.
- **Llega la fecha antes de que se atienda el pedido** — El pedido se cancela, el desafío original se publica sin cambios y el día sale de la grilla (pasa a ser hoy). `[fuente: REQ-008 CA 7]`

### Errores y recuperación

- **El reemplazo no pasa la verificación** — Queda el desafío actual `approved`. La celda y O-02 muestran «regeneración fallida» con el motivo; P-03 lo avisa. Recuperación: volver a regenerar o dejar el actual. No se registra una falla de generación, porque el día tiene desafío. `[fuente: REQ-008 CA 6]`
- **El desafío dejó de ser regenerable** (se publicó, se anuló o su fecha ya no es futura) — La API responde `not_regenerable`; O-03 informa «Solo se puede regenerar un desafío aprobado de una fecha futura» y no crea el pedido. Recuperación: refrescar P-03. `[fuente: REQ-008 CA 5]`
- **El desafío ya no existe** (`404`) — O-03 se cierra y P-03 se refresca.
- **El generador está caído** — El pedido queda pendiente y la celda en «Regenerando…» hasta que el generador vuelve y lo atiende (o hasta que llega la fecha y se cancela). Recuperación: ninguna en la superficie.
- **Falla al cargar la grilla** — P-03 distingue error de carga de «sin desafío», con reintento; las previews se cargan solo al abrir O-02.
- **Sesión vencida durante el polling o con O-03 abierto** — Ver Flujo 1; al volver, P-03 muestra el estado real de cada celda (el pedido, si se envió, sigue en curso).
- **Hueco de generación sin vía de resolución en la superficie** — El admin muestra los días sin desafío y sus fallas, pero no crea desafíos (fuera de alcance de REQ-008); depende de que una corrida posterior lo logre. Riesgo de recuperación aceptado.

### Estado final

La grilla refleja que cada celda dudosa fue reemplazada (desafío nuevo aprobado) o que se dejó el actual (con su motivo si la regeneración falló). No quedan celdas en «regeneración pendiente» salvo las en curso, y las fallas activas siguen a la vista hasta que una corrida las resuelve.

### Criterios de éxito

- Detecta de un vistazo qué días de los próximos 14 quedan sin desafío en cada juego, y por qué. `[fuente: PRD §F-12 C-43, C-49]`
- Puede revisar un desafío futuro como lo verá el jugador (solución en español, log) sin cargar nada a mano.
- Una regeneración fallida o cancelada nunca deja una celda sin desafío.
- Se entera de una falla de generación desde cualquier pantalla del admin por el contador del encabezado, sin mail.

---

## Flujo 5: Consultar stock y métricas

**JTBD que resuelve:** JTBD 2 (stock): "mirar el stock de contenido de los bancos" `[fuente: PRD §F-12 C-45]`; JTBD 3: "Cuando quiero saber si la plataforma se usa y si los desafíos funcionan, quiero consultar las métricas de uso, retención y calidad por desafío, para decidir si hay algo que revisar." `[fuente: PRD §F-13 C-46]`
**Audiencia:** responsable ([research-context](../../audiences/responsable/research-context.md))
**Trigger:** Revisión de rutina (frecuencia desconocida, ver "Lo que NO sabemos") o seguimiento de una alerta de stock o de un hueco visto en P-03.

### Happy path

1. El responsable abre P-04 (Stock de contenido) desde el encabezado.
2. Ve la última carga del dataset (fecha, versión, insertados, actualizados) y, por banco (términos desglosado por Devdle y Grep Grid; hechos para Tech Timeline): ítems aprobados disponibles y totales, rechazados, días de stock estimados y si alcanza para ciclar respetando la ventana anti-repetición de cada juego; desde REQ-012 los disponibles, los días y el ciclo de Devdle no cuentan los términos que Devdle nunca elige. Un resumen «Ítems rechazados» da el total por banco con «Ver en Bancos →». Además el top 50 de palabras rechazadas en Devdle por cantidad de jugadores distintos, paginado de a 10, solo lectura. `[fuente: REQ-008 CA 11-13; REQ-012]`
3. Concluye que el stock es suficiente y abre P-05 (Métricas).
4. P-05 abre con los últimos 30 días UTC; si quiere, cambia `from` y `to` y toca «Consultar». Ve cuatro cifras resumen (jugadores únicos, retención D1 y D7, partidas completadas) y las tablas: jugadores diarios total y por juego, retención D1/D7 por cohorte, distribución de rachas vivas a hoy y calidad por desafío. Cada tabla define su métrica al pie. `[fuente: C-46; REQ-011 RF 11-16]`
5. Ordena la tabla de calidad por «Completado», «Victorias» o «Reportes», identifica un desafío con tasa baja o muchos reportes y decide si revisarlo (ver camino alternativo). `[fuente: REQ-011 decisión de diseño de P-05]`

### Caminos alternativos

- **Solo métricas** — Entra directo a P-05 sin pasar por P-04.
- **Revisar los ítems de un banco** — Desde «Ver en Bancos →» de P-04 (o desde «Bancos» del encabezado) llega a P-06 filtrado por los rechazados de ese banco; ve cada ítem con su motivo, su último uso por juego y si Devdle lo excluye. Busca por texto (la búsqueda se aplica sola tras una pausa al tipear o con Enter), filtra por estado y categoría y pagina de a 25; los filtros quedan en la URL. Cambiar de pestaña (Términos / Hechos) limpia los filtros. Solo lectura. `[fuente: REQ-012 (S-067, S-068)]`
- **Tablas largas de Métricas** — Jugadores diarios y calidad se paginan de a 15 filas; ordenar la tabla de calidad vuelve a la página 1. `[fuente: REQ-012]`
- **Un desafío de baja calidad** — La fila de calidad no enlaza a Reportes ni al desafío (pregunta 6, resuelta por REQ-011: no en v1). El responsable va a P-02 por el encabezado para investigar. Un desafío anulado sigue en la tabla con estado «anulado», y sus partidas anuladas no cuentan en terminadas ni en victorias. `[fuente: REQ-011 CA 17]`
- **Banco por agotarse** — P-04 muestra días de stock bajos o «Alcanza para ciclar: No» con un aviso que dice qué juego no alcanza; la acción es externa a la superficie (solo lectura, C-45). Alimenta el Flujo 4 si empiezan a aparecer huecos.
- **Palabra rechazada que debería aceptarse** — El responsable la ve en el top 50 y la suma a la lista base fuera del admin (cambio de código, F-15): no hay acción en P-04.
- **Sin carga registrada o sin rechazos** — P-04 muestra «Sin datos de carga» y, en el top de palabras, «Sin rechazos…» como estados vacíos, no como error; un banco sin ítems rechazados dice «0 rechazados» sin enlace. En P-06, una búsqueda sin resultados dice «Ningún ítem coincide con los filtros.». `[fuente: REQ-008 CA 14; REQ-012]`
- **Cambiar el rango** — Reconsultar con otro rango; todas las cifras y tablas lo respetan salvo la distribución de rachas, que es una foto a hoy y lo aclara al pie. El rango queda en la URL: recargar o volver atrás conserva lo consultado. `[fuente: REQ-011 supuesto «Distribución de rachas»]`
- **Cohorte reciente** — D1 o D7 se ve «—» si ese día todavía no terminó, no 0 %. `[fuente: REQ-011 CA 15]`

### Errores y recuperación

- **Rango inválido** (vacío, `from` > `to`, fechas futuras o más de 366 días) — P-05 marca el campo, muestra el motivo y no consulta ni muestra datos. Si el servidor rechaza un rango que el navegador aceptó (reloj desfasado), se muestra el mensaje del servidor. Recuperación: corregir el rango. `[fuente: REQ-011 CA 20]`
- **Rango sin Play** — Cifras en 0 y «—», y cada tabla dependiente del rango dice «Sin datos en el rango.», distinto de error de carga; la distribución de rachas sigue con datos. Recuperación: ampliar el rango. `[fuente: REQ-011 CA 19]`
- **Error de carga o API caída** — Cada pantalla muestra el error con reintento, sin mostrar cifras viejas como actuales (P-06: «No pudimos cargar el banco. Probá de nuevo.» con «Reintentar»; mientras llega otra página se sigue viendo la anterior).
- **Filtros inválidos en la URL de P-06** — Un `bank`, `status`, `category` o `page` inválido cae al valor por defecto en lugar de romper la pantalla. `[fuente: REQ-012]`
- **Sesión vencida** — Ver Flujo 1; tras ingresar, el rango elegido se pierde (el login lleva a P-02).
- **Cifra que no cuadra con lo que el responsable espera** — La definición de cada métrica está al pie de su tabla (cohorte, tramos de rachas, anuladas, total diario no sumable; REQ-011). Si no basta, no hay otra fuente dentro de la superficie. A validar.

### Estado final

El responsable sabe si el stock alcanza y cómo se comportan uso, retención y calidad en el rango, y decide si hay algo que revisar (en P-02, P-03 o fuera del admin). No cambia ningún dato en el sistema (solo lectura).

### Criterios de éxito

- Ve el estado de cada banco y si alcanza para ciclar sin hacer cuentas. `[fuente: PRD §F-12 C-45]`
- Elige un rango y ve cifras resumen antes del detalle. `[fuente: benchmark - Plausible Analytics]`
- Distingue sin ambigüedad "sin datos" de "error de carga".

---

**Relacionados:** Las pantallas usadas en estos flujos están inventariadas en `product-map.md` de esta superficie. Los flujos que cruzan a otras superficies viven en `../cross-surface-flows.md`.
