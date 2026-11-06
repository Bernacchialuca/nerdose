---
foundation: color
version: 1.2.0
last_updated: 2026-11-06
status: defined
source: docs/nerdose.html
---

# Color

## Propósito

Define la paleta oscura de `web` y el rol de cada color: neutros de superficie y texto, acento de marca, acento propio de cada juego con su escala de tintes, estados (acierto, error, presente, pendiente), racha y heatmap. Todos los valores salen del prototipo `docs/nerdose.html` (fuente de verdad visual); la columna **Fuente** cita la línea `L###`. Lo consumen diseño (al componer pantallas) y desarrollo (vía tokens semánticos, nunca hex directos).

## Principios

1. **Oscuro y sólido.** Fondo `#0A0C0F`, texto `#E6EDF3`. Los tintes de acento son **hex opacos muy oscuros**, no transparencias (las únicas transparencias son el header de Home, el anillo y el glow de la tarjeta destacada y la sombra de la terminal).
2. **Cada juego se apropia de su pantalla.** Breadcrumb, links y su hover, Compartir activo, pestaña activa, números de paso y borde del botón de salida van en el acento del juego (L264, L391, L522, L754, L928, L1050, L1154).
3. **La racha siempre es ámbar `#FFB547`**, sin importar el acento del juego: píldora con llama, `▲ racha N`, `racha N · máx M`, tarjeta de racha, número gigante. El estado *pendiente* también es ámbar.
4. **Verde = completado/correcto**, **rojo = error** (`#FF7B72`). El CTA de avanzar ("Siguiente juego →") es verde aunque el juego tenga otro acento (L622, L877).
5. **Cada acento tiene una escala de ~5 tonos**: fondo tintado (L≈8-10%), borde (≈20-25%), texto apagado (≈55%), acento, tono claro de hover (≈80%), más un **on-accent** casi negro del mismo matiz (no negro puro).

## Paleta

### Neutros

| Primitivo | Hex | Rol | Fuente |
|---|---|---|---|
| `color.neutral.950` | `#0A0C0F` | Fondo de página | L16, L263 |
| `color.neutral.950-a92` | `rgba(10,12,15,0.92)` | Fondo translúcido del header de Home | L18 |
| `color.neutral.925` | `#0D1116` | Superficie hundida: bloque de código, tablero de Grep, diff | L651, L885, L1117, L720 |
| `color.neutral.900` | `#0F1318` | Superficie: tarjetas y paneles | L84, L481… |
| `color.neutral.850` | `#11151A` | Controles: botón-ícono, selector de idioma, Compartir deshabilitado | L30, L443, L445 |
| `color.neutral.840` | `#11161C` | Barra de pestañas del bloque de código | L652, L886 |
| `color.neutral.835` | `#12161B` | Tecla descartada (Devdle) | L563 |
| `color.neutral.830` | `#12171D` | Barra de título de la ventana terminal | L48 |
| `color.neutral.800` | `#141920` | Superficie interna sin borde: mini-stat, métrica, fila de test, celda de Grep | L225, L344, L683, L1199 |
| `color.neutral.790` | `#161B22` | Ítem de nav activo; separador de filas de tabla | L21, L374 |
| `color.neutral.775` | `#1A2028` | Track de barras, nivel 0 del heatmap, celda "no está" | L237, L272, L533 |
| `color.neutral.770` | `#1A2029` | Puntos del patrón de fondo | L16 |
| `color.neutral.750` | `#1E252E` | Separadores (header, tab-bar, `th`, footer); borde de tarjeta "Cómo funciona" | L18, L248, L363 |
| `color.neutral.700` | `#222A33` | Borde de tarjetas y paneles | L84, L481 |
| `color.neutral.650` | `#2A323C` | Borde de controles, chips y punteados; fondo de segmento/tecla activos; `/` del breadcrumb | L30, L43, L192, L438, L564 |
| `color.neutral.600` | `#3A424C` | "Semáforos" de la ventana terminal | L49-51 |
| `color.neutral.550` | `#4F5A66` | Números de línea del bloque de código (requiere adaptación, ver Accesibilidad) | L662, L893 |
| `color.neutral.525` | `#5A6573` | Borde de celda "escrita" (Devdle) | L534 |
| `color.neutral.510` | `#5F6B78` | Texto de tecla descartada (requiere adaptación) | L563 |
| `color.neutral.500` | `#6B7682` | Texto de control deshabilitado (Compartir) | L445 |
| `color.neutral.400` | `#8D99A6` | Texto terciario: etiquetas-comentario `//`, metadatos | ~40 usos, L70 |
| `color.neutral.300` | `#9AA6B2` | Texto apagado: notas, etiquetas de stat, nav inactivo | L22, L241 |
| `color.neutral.250` | `#A9B4BF` | Lede y descripciones | L40, L96 |
| `color.neutral.200` | `#C3CCD5` | Texto secundario claro: explicaciones, leyendas, íconos de botón | L248, L443, L729 |
| `color.neutral.100` | `#E6EDF3` | Texto principal | L16 |
| `color.black-a45` | `rgba(0,0,0,0.45)` | Sombra de la ventana terminal | L47 |

### Marca

| Primitivo | Hex | Rol | Fuente |
|---|---|---|---|
| `color.green.500` | `#3DDC84` | Acento de marca (y de Devdle), `>` y `_` del logo, CTA primario | L19, L42 |
| `color.green.300` | `#7CF0B0` | Hover de links en Home | L264 |
| `color.green.975` | `#06120B` | Texto sobre verde | L42 |

### Escala por acento de juego

Columnas: **tinte** (fondo muy oscuro: miniatura de tarjeta, fondos de selección), **borde del tinte**, **apagado** (texto o barras inactivas dentro de la miniatura), **acento**, **claro** (hover de link, texto destacado), **on-accent** (texto sobre el acento relleno).

| Juego | Tinte | Borde del tinte | Apagado | Acento | Claro / hover | On-accent | Fuente |
|---|---|---|---|---|---|---|---|
| Devdle (verde) | `#0C1A12` | `#16301F` | `#1E3A28` (borde de celda vacía) | `#3DDC84` | `#7CF0B0` | `#06120B` | L85-88, L264 |
| Bug Hunt (ámbar) | `#1A140A` | `#33260F` | `#7A5A2A` (nº de línea), `#3A2C14` (barras) | `#FFB547` | `#FFD08A` | `#1A1206` | L105-110, L604, L754 |
| Big O (azul) | `#0B1522` | `#1B2E45` | `#7FA7CF` (texto de chip), `#23405F` (borde de chip) | `#5EB1FF` | `#9ACFFF` | `#06121F` | L126-131, L142, L928 |
| Tech Timeline (violeta) | `#161024` | `#2B2045` | `#B596E6` (años), `#3C2E60` (riel) | `#C39BFF` | `#DCC4FF` | `#160E26` | L147-155, L166, L1050 |
| Grep Grid (rosa) | `#1A0B16` | `#3A1530` | `#8A5C7A` (letras) | `#F472B6` | `#F9A8D4` | `#24081A` | L171-176, L188, L1154 |

Tonos adicionales por juego (usados en una sola pantalla):

| Juego | Hex | Uso | Fuente |
|---|---|---|---|
| Bug Hunt | `#2A1F0B` | Tinte fuerte: pestaña activa, número de paso, línea resaltada de la miniatura, badge "pendiente" | L108, L136, L729, L817 |
| Bug Hunt | `#15110A` | Hover de línea elegible | L755 |
| Bug Hunt | `#5C4419` | Borde de chip ámbar ("tipo: …") y borde punteado de fila mal ubicada (Timeline) | L736, L1064 |
| Bug Hunt | `#2A2416` / `#8A7856` | Botón Confirmar deshabilitado (fondo / texto) | L836 |
| Big O | `#2E4C6E` | Borde de la tarjeta destacada (próximo a jugar) | L125 |
| Big O | `#5EB1FF33` | Anillo de 1px de la tarjeta destacada (acento al 20%) | L125 |
| Big O | `rgba(20,60,110,0.25)` | Glow de la tarjeta destacada | L125 |
| Big O | `#8CC8FF` | Anotaciones de código, texto del número de paso | L909, L951 |
| Big O | `#11243A` | Fondo del número de paso | L909 |
| Big O | `#0E1D2E` | Fondo de línea de código resaltada | L952 |
| Big O | `#1D2A3A` | Fondo de pestaña activa | L961 |
| Grep Grid | `#2A0F22` | Fondo de celda de inicio seleccionada | L1197 |
| Grep Grid | `#1F0D19` / `#5B2147` | Fila de palabra encontrada (fondo / borde) | L1216 |

### Estados

| Estado | Fondo tintado | Borde | Texto suave | Acento | On-accent | Extra | Fuente |
|---|---|---|---|---|---|---|---|
| Acierto / éxito (verde) | `#0C1A12` | `#1E4A30` | `#A9C9B5` | `#3DDC84` | `#06120B` | Badge `#12301F` / `#7CF0B0`; fila correcta `#0E1A13`; diff `+` `#9EF0C2` | L614-619, L94, L1064, L722 |
| Error / fallo (rojo) | `#1C0F0E` | `#4A2220` | `#D9B3AF` | `#FF7B72` | `#1C0605` | Diff `−` `#FFB3AD` | L626-631, L712, L721 |
| Presente (Devdle) | transparente | `2px dashed #FFB547` | — | `#FFB547` | — | Es un **borde punteado**, no un relleno | L532, L484, L87 |
| No está (Devdle) | `#1A2028` | `#1A2028` | `#8D99A6` | — | — | — | L533 |
| Pendiente | `#2A1F0B` | — | — | `#FFB547` | — | Badge "pendiente", estado en terminal | L136, L58 |
| Mal ubicado (Timeline) | `#17130B` | `1px dashed #5C4419` | — | `#FFB547` | — | Error ≠ rojo en Timeline: ámbar + punteado | L1064 |
| Advertencia *(adaptación de producto)* | `#140F07` | `#3A2A12` | `#C9A46A` | `#FFB547` | `#1A1206` | Aviso O-03; tintes del panel ámbar "contexto" (L646-647) | L646 |

### Racha (siempre ámbar)

| Primitivo | Hex | Uso | Fuente |
|---|---|---|---|
| `color.amber.500` | `#FFB547` | Texto/ícono de racha, número gigante | L26, L211, L310 |
| `color.amber.950` | `#1A140A` | Fondo de la píldora de racha | L26 |
| `color.amber.860` | `#3A2A12` | Borde de la píldora y de la tarjeta de racha | L26, L308 |
| `color.amber.975` | `#140F07` | Fondo de la tarjeta de racha (Stats) y del panel "contexto" | L308, L646 |
| `color.amber.dim.400` | `#C9A46A` | Etiqueta-comentario ámbar y unidad "días" | L309, L310, L647 |
| `color.amber.dim.300` | `#C9B48F` | Nota de la tarjeta de racha | L311 |

### Heatmap de actividad

| Nivel | Hex | Fuente |
|---|---|---|
| 0 (sin actividad) | `#1A2028` | L272, L396 |
| 1 | `#14532D` | L272 |
| 2 | `#1F8F4E` | L272 |
| 3 | `#2FBF6B` | L272 |
| 4 | `#3DDC84` | L272 |

La rampa es verde (marca), no el acento de un juego.

## Tokens

### Semánticos (resumen; tabla completa en `tokens/semantic.md`)

| Token | Valor | Uso |
|---|---|---|
| `bg.canvas` | `color.neutral.950` | Fondo de página |
| `bg.surface` | `color.neutral.900` | Tarjetas y paneles |
| `bg.surface.sunken` | `color.neutral.925` | Código, tablero de Grep, diff |
| `bg.surface.inset` | `color.neutral.800` | Cajas internas sin borde |
| `bg.control` | `color.neutral.850` | Fondo de controles neutros |
| `text.primary` / `text.body` / `text.lede` / `text.muted` / `text.dim` | `neutral.100` / `200` / `250` / `300` / `400` | Jerarquía de texto |
| `border.default` / `border.subtle` / `border.control` | `neutral.700` / `750` / `650` | Tarjetas / separadores / controles |
| `accent.brand` / `accent.brand.on` / `accent.brand.hover` | `green.500` / `green.975` / `green.300` | Marca |
| `game.{juego}.accent` / `.on` / `.hover` / `.tint` / `.tint-border` / `.muted` | escala por juego | Acento del juego en su pantalla |
| `status.success.*`, `status.error.*`, `status.present`, `status.pending.*`, `status.misplaced.*`, `status.warning.*` | ver arriba | Estados |
| `streak.*` | escala ámbar | Racha |
| `data.heatmap.0`…`4` | rampa verde | Heatmap |

### De componente

Ver `tokens/component.md`. Ejemplos: `button.primary.bg → accent.brand`, `streak-pill.bg → streak.bg`, `banner.success.bg → status.success.bg`.

## Guidelines

**Do:**
- Consumir siempre tokens semánticos; los componentes nunca declaran hex.
- Pintar todo lo de racha con `streak.*` (ámbar), también dentro de un juego de otro color.
- Usar el `on` del mismo matiz sobre cualquier acento relleno (`#06121F` sobre azul, no `#06120B`).
- Tintar las superficies de estado con hex opacos de la escala (fondo + borde del mismo matiz).
- Mantener el CTA de avanzar ("Siguiente juego →") en `accent.brand`, aunque el juego sea de otro color.

**Don't:**
- No usar el acento de un juego en otra pantalla que no sea la suya (salvo en el catálogo y en Stats, donde identifica al juego).
- No usar rojo para el error de Timeline: el prototipo usa ámbar + borde punteado (L1064).
- No rellenar de amarillo la letra "presente" de Devdle: es borde punteado ámbar.
- No colorear `✓`/`✗` de la tabla de historial: en el prototipo son texto plano (L374-379).
- No copiar los tintes de un juego en otro. Si un estado no está definido para un juego, se deriva de **su propia** escala (tinte, borde del tinte, apagado, acento, claro, on-accent) siguiendo el mismo patrón que el juego que sí lo tiene. Ejemplo: la tarjeta `next` de Big O usa su borde del tinte + anillo de 1px del acento al 20% + glow; para Devdle se arma igual con la escala de Devdle.

## Accesibilidad

Ratios medidos (WCAG 2.1, fórmula de luminancia relativa). Umbral: texto ≥ 4,5:1 (texto grande ≥ 3:1); componentes de interfaz y gráficos ≥ 3:1 (1.4.11).

### Texto — pares que pasan

| Texto | Fondo | Ratio |
|---|---|---|
| `#E6EDF3` | `#0A0C0F` / `#0F1318` / `#0D1116` | 16,6 / 15,8 / 16,0 |
| `#C3CCD5` | `#0A0C0F` / `#0F1318` / `#141920` / `#11151A` | 12,1 / 11,5 / 10,9 / 11,3 |
| `#A9B4BF` | `#0A0C0F` / `#0F1318` | 9,3 / 8,9 |
| `#9AA6B2` | `#0A0C0F` / `#0F1318` / `#141920` / `#11151A` / `#161B22` | 7,9 / 7,5 / 7,1 / 7,4 / 7,0 |
| `#8D99A6` | `#0A0C0F` / `#0F1318` / `#0D1116` / `#12171D` / `#1A2028` | 6,8 / 6,4 / 6,5 / 6,2 / 5,7 |
| `#3DDC84` | `#0A0C0F` / `#0F1318` | 11,0 / 10,5 |
| `#FFB547` | `#0A0C0F` / `#0F1318` / `#1A140A` / `#2A1F0B` / `#17130B` | 11,2 / 10,6 / 10,4 / 9,2 / 10,5 |
| `#5EB1FF` | `#0A0C0F` / `#0F1318` | 8,6 / 8,2 |
| `#C39BFF` | `#0A0C0F` / `#0F1318` | 8,8 / 8,4 |
| `#F472B6` | `#0A0C0F` / `#0F1318` / `#2A0F22` | 7,4 / 7,0 / 6,7 |
| `#FF7B72` | `#0F1318` / `#1C0F0E` | 7,4 / 7,4 |
| `#7CF0B0` sobre `#12301F` (badge éxito) | | 10,2 |
| `#C9A46A` / `#C9B48F` sobre `#140F07` | | 8,2 / 9,5 |
| `#A9C9B5` sobre `#0C1A12` (subtítulo éxito) | | 10,0 |
| `#D9B3AF` sobre `#1C0F0E` (subtítulo fallo) | | 9,8 |
| `#9EF0C2` sobre `#0C1A12` / `#FFB3AD` sobre `#1C0F0E` (diff) | | 13,4 / 11,0 |
| `#8CC8FF` sobre `#0E1D2E` / `#11243A` | | 9,6 / 8,8 |
| `#F9A8D4` sobre `#2A0F22` / `#1F0D19` | | 9,7 / 10,3 |
| `#E6EDF3` sobre `#2A323C` (segmento activo, tecla) / `#1D2A3A` (pestaña Big O) | | 11,0 / 12,3 |
| Pares derivados en S-011: `#06120B`/`#7CF0B0` (hover `primary`) · `#1A1206`/`#FFD08A` (hover `accent` Bug Hunt) · `#06121F`/`#9ACFFF` · `#160E26`/`#DCC4FF` · `#24081A`/`#F9A8D4` | | 13,6 · 12,9 · 11,4 · 11,9 · 10,3 |
| `#FFD08A` sobre `#1A140A` (hover de la píldora de racha) | | 12,7 |
| `#8D99A6` sobre `#11151A` (píldora sin racha) | | 6,3 |
| `#1A1206` sobre `#FFB547` (ícono del banner `warning`) | | 10,5 |
| Hover de links: `#7CF0B0` / `#FFD08A` / `#9ACFFF` / `#DCC4FF` / `#F9A8D4` sobre `#0A0C0F` | | 13,9 / 13,7 / 11,9 / 12,5 / 10,8 |
| On-accent: `#06120B`/verde · `#06121F`/azul · `#160E26`/violeta · `#24081A`/rosa · `#1A1206`/ámbar · `#1C0605`/rojo | | 10,7 · 8,3 · 8,4 · 7,1 · 10,6 · 7,7 |

### Texto — pares que fallan (adaptación requerida)

| Par | Ratio | Dónde | Adaptación requerida |
|---|---|---|---|
| `#4F5A66` sobre `#0D1116` | **2,7** | Números de línea del código (L662, L893) | Es texto con significado (Bug Hunt pregunta "¿en qué línea?"): tiene que llegar a ≥ 4,5:1. El prototipo no ofrece un tono intermedio; `#6B7682` da 4,1 (no alcanza) y `#8D99A6` da 6,5 pero coincide con el de las líneas no elegibles. **Pendiente** elegir el tono; requisito: ≥ 4,5:1 y distinguible del texto de código. |
| `#5F6B78` sobre `#12161B` | **3,3** | Tecla descartada de Devdle (L563) | La tecla sigue siendo operable: su letra necesita ≥ 4,5:1. El tachado (`line-through`) ya da la señal no cromática. **Pendiente** el tono; `#8D99A6` sobre `#12161B` da 6,3. |

### Pares exentos (documentados)

- Controles deshabilitados (WCAG 1.4.3 los exceptúa): Compartir `#6B7682`/`#11151A` 4,0; Confirmar `#8A7856`/`#2A2416` 3,6.
- Decorativos (`aria-hidden`): `/` del breadcrumb `#2A323C` (1,5); letras y números de las miniaturas de tarjeta (`#7A5A2A`, `#8A5C7A`, `#B596E6` 7,5, `#7FA7CF` 7,3).

### No texto (WCAG 1.4.11, ≥ 3:1)

| Elemento | Ratio | Evaluación |
|---|---|---|
| Borde de control `#2A323C` sobre `#0A0C0F` / `#11151A` | 1,5 / 1,4 | Los botones con texto se identifican por su etiqueta; 1.4.11 no exige el borde. Se respeta el valor del prototipo. Cuando el borde sea **lo único** que identifica un control o su estado, usar `border.interactive` (`#8D99A6`, 6,8:1). |
| Indicador del segmento activo `#3DDC84` sobre `#2A323C` / `#11151A` (S-011) | 7,3 / 10,3 | Resuelve la fila siguiente. |
| Bordes de la tarjeta `next` derivados sobre `#0F1318` (S-011): Devdle `#1E4A30` 1,8 · Bug Hunt `#5C4419` 2,0 · Tech Timeline `#3C2E60` 1,6 · Grep Grid `#5B2147` 1,6 | 1,6 - 2,0 | Decorativos: la señal de `next` es el CTA relleno y ser el destino de "Seguir jugando". |
| Segmento activo del selector de idioma `#2A323C` sobre `#11151A` | 1,4 | **Resuelta en S-011 con un indicador inferior** (fila anterior). Original: **Adaptación requerida:** el estado seleccionado no puede depender solo de este fondo. El texto cambia de `#9AA6B2` a `#E6EDF3` (2,1:1 entre sí). **Pendiente** la señal adicional (ver `components/language-selector.md`). |
| Celda "escrita" `#5A6573` sobre `#0F1318` | 3,2 | Pasa. |
| Celda vacía de Devdle `#222A33` sobre `#0A0C0F` | 1,4 | No interactiva; el estado lo anuncia `aria-label`. |
| Heatmap nivel 1 `#14532D` / nivel 0 `#1A2028` sobre `#0F1318` | 2,1 / 1,1 | El heatmap lleva alternativa textual (`role="img"` + `aria-label`, L216, L321). Los niveles no son distinguibles a 3:1: si alguna vez el heatmap transmite datos por celda, hace falta una alternativa por celda. |
| Segmento pendiente de progreso `#2A323C` sobre `#0F1318` | 1,4 | El dato está en texto al lado (`// 5 juegos · 2 completados`, L70) y en `aria-label` (L73). |

### Color no es la única señal (NFR-U04)

- Presente (Devdle) = borde **punteado**; mal ubicado (Timeline) = borde **punteado** + "✗ va en N°"; correcto = "✓ bien".
- Correcta vs. no está (Devdle) se distinguen por relleno claro vs. oscuro (9,2:1 entre sí) y por `aria-label`, pero NFR-U04 pide ícono o patrón: **adaptación requerida, Pendiente** (ver `patterns/game-boards.md`).
- Opción correcta de Big O: relleno verde + borde 2px + peso 800 (L970); **Pendiente** confirmar si alcanza para NFR-U04.

## Ejemplos

- `components/button.md` — `accent.brand`, `game.*.accent`, `border.control`.
- `components/banner.md` — `status.success.*`, `status.error.*`, `status.warning.*`.
- `components/streak-pill.md` y `components/streak-number.md` — `streak.*`.
- `components/heatmap.md` — `data.heatmap.*`.
- `patterns/game-boards.md` — `status.present`, `status.absent.*`, tintes por juego.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial (bootstrap automático).
- 2026-11-03 v0.1.1 — Se reemplaza la paleta clara de relleno por la oscura del prototipo (`#0A0C0F`, `#3DDC84`).
- 2026-11-03 — `color.brand.primary` = `#3DDC84`, confirmado por el usuario en /product-ux-generate.
- 2026-11-05 v0.2.0 — Consumidores de `color.warning` y `color.error` (Banner, Alert); semánticos `text.warning` y `border.warning`.
- 2026-11-05 v1.0.0 — Reescrita desde el prototipo: 14 neutros nuevos, escala de tintes por juego y por estado, rampa del heatmap, regla "racha siempre ámbar", contrastes medidos de todos los pares de texto y adaptaciones requeridas (números de línea, tecla descartada, selector de idioma). `color.green.950` pasa a `color.green.975`; se elimina `color.info`.
- 2026-11-05 v1.1.0 — Los estados no definidos para un juego se derivan de su propia escala en lugar de quedar pendientes.
- 2026-11-06 v1.2.0 — Contrastes medidos de los pares derivados (hovers, indicador del selector, ícono `warning`, bordes `next`).
