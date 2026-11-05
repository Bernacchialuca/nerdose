---
foundation: typography
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Tipografía

## Propósito

Define las dos familias de `web`, cuándo se usa cada una y la escala completa de roles tipográficos que aparecen en el prototipo `docs/nerdose.html`, con tamaño, peso, interlineado y tracking reales. La consumen diseño y desarrollo vía los tokens `type.*`.

## Familias

| Token | Familia | Pesos cargados | Pesos usados | Fallback | Fuente |
|---|---|---|---|---|---|
| `font.family.sans` | Inter | 400, 500, 600, 700 | **400 y 700** (este último solo vía `<b>`) | `system-ui, sans-serif` | L8, L16 |
| `font.family.mono` | JetBrains Mono | 400, 500, 700, 800 | 400, 500, 700, 800 | `monospace` | L8 |

Inter 500 y 600 se cargan en el prototipo pero no se usan: no forman parte del DS.

### Regla de uso

- **Inter es la fuente base de la página** (el wrapper de cada pantalla declara `font-family: 'Inter', system-ui, sans-serif`, L16, L287, L433, L588, L848, L979, L1083). JetBrains Mono se aplica pieza por pieza.
- **Si es prosa de más de una frase → Inter.** Lede del hero, descripciones de tarjeta, explicaciones, pasos numerados, etiquetas de stat, notas al pie y textos de ayuda.
- **Si es interfaz, dato, título o código → JetBrains Mono.** Logo, nav, todos los títulos (`h1`-`h3`), todos los números, botones y links-CTA, selector ES/EN, píldora de racha, badges y chips, etiquetas-comentario `//`, prompts `$`, metadatos, tablas, código, terminal, celdas y teclas de juego, `<code>` dentro de un párrafo Inter.
- **Los títulos nunca van en Inter.**
- Los `<button>` no heredan fuente en los navegadores: todo botón declara Mono explícitamente.
- **Sin `text-transform`.** Todo se escribe en minúscula o mixto tal cual; las mayúsculas (ES/EN, letras de Devdle y Grep, ENTER) son literales.

### Ligaduras

JetBrains Mono trae ligaduras de programación (`>=` → `≥`). En el prototipo se desactivan en Bug Hunt (`#app *{font-variant-ligatures:none}`, L757) para que el bug se lea literal. **El DS las desactiva en todo texto Mono** (`font-variant-ligatures: none`): un juego de código no puede mostrar `≥` donde el código dice `>=`.

## Escala de roles

Todos los `h1`/`h2`/`h3` del prototipo heredan el bold (700) del navegador salvo indicación; el DS lo declara explícito. `normal` = interlineado por defecto de la fuente. Tracking `0` = no declarado.

### Display (Mono)

| Token | Size / weight / line-height / tracking | Uso | Fuente |
|---|---|---|---|
| `type.display.streak` | 96 / 800 / 0.9 / -4px | Número de racha global, Stats | L310 |
| `type.display.streak.compact` | 88 / 800 / 0.9 / -4px | Número de racha, panel "Tu progreso" de Home | L211 |
| `type.display.hero` | 64 / 800 / 1.02 / -2.5px | Titular del hero de Home | L39 |
| `type.display.score` | 56 / 800 / 1 / -2px | Puntaje de resultado ("3/5"), color del juego | L1004 |

### Títulos (Mono, 700)

| Token | Size / weight / lh / tracking | Uso | Fuente |
|---|---|---|---|
| `type.title.page` | 40 / 700 / normal / -1.5px | Título de pantalla ("Tus estadísticas") | L304 |
| `type.title.game` | 34 / 700 / normal / -1px | Título de pantalla de juego | L456, L640, L1001, L1105 |
| `type.title.game.long` | 30 / 700 / normal / -1px | Variante para preguntas largas (Big O) | L883 |
| `type.title.section.lg` | 32 / 700 / normal / -1px | Título de sección principal de Home | L71 |
| `type.title.section` | 26 / 700 / normal / -0.5px | Título de sección ("Tu progreso", "Cómo funciona") | L205, L246 |
| `type.title.section.compact` | 24 / 700 / normal / -0.5px | Título de sección en Stats | L332, L358 |
| `type.title.panel.lg` | 22 / 700 / normal / 0 | Título de panel de explicación (Big O "Paso a paso") | L907 |
| `type.title.panel` | 20 / 700 / normal / 0 | Título de panel de explicación (Bug Hunt "Por qué falla") | L727 |
| `type.title.card` | 20 / 700 / normal / 0 | Título de tarjeta de juego, color = acento | L93 |
| `type.title.card.compact` | 18 / 700 / normal / 0 | Título de tarjeta por juego en Stats, color = acento | L409 |
| `type.title.banner` | 18 / 700 / normal / 0 | Título del banner de resultado | L618, L630, L872 |

### Marca y header (Mono)

| Token | Size / weight / lh / tracking | Uso | Fuente |
|---|---|---|---|
| `type.brand.logo` | 20 / 800 / normal / -0.5px | Logo `> nerdose_` del header global | L19 |
| `type.brand.logo.compact` | 18 / 800 / normal / 0 | Logo `> nerdose` del header de juego | L437 |
| `type.brand.crumb` | 18 / 700 / normal / 0 | Nombre del juego en kebab-case, color = acento | L439 |

### Números y datos (Mono)

| Token | Size / weight | Uso | Fuente |
|---|---|---|---|
| `type.numeric.xl` | 30 / 800 | Valor de stat-card (Stats) | L314-317 |
| `type.numeric.lg` | 26 / 800 | Contador de partida (Grep "3/8", "02:14") | L1109-1110 |
| `type.numeric.md` | 22 / 700 | Valor de mini-stat (Home) | L225-227 |
| `type.numeric.sm` | 20 / 700 | Valor de métrica en tarjeta por juego (Stats) | L345 |
| `type.numeric.year` | 18 / 800 | Año en la línea de tiempo de resultado | L1029 |

### Piezas de juego (Mono)

| Token | Size / weight | Uso | Fuente |
|---|---|---|---|
| `type.game.tile.lg` | 28 / 800 | Letra de celda Devdle 64×64 | L529 |
| `type.game.tile.md` | 18 / 700 | Letra de celda Grep 48×48 | L1191 |
| `type.game.tile.sm` | 16 / 800 | Muestra de leyenda Devdle 36×36 | L483-485 |
| `type.game.option` | 16 / 400 (800 elegida) | Opción de Big O | L970 |
| `type.game.item` | 16 / 700 | Nombre de ítem de Timeline | L1016, L1032 |
| `type.game.key` | 15 / 700 | Tecla de Devdle | L558 |
| `type.game.key.small` | 12 / 700 | Tecla ENTER | L570 |
| `type.game.word` | 15 / 700 | Palabra de la lista de Grep | L1217 |

### Prosa (Inter, 400)

| Token | Size / weight / lh | Uso | Fuente |
|---|---|---|---|
| `type.body.lede` | 19 / 400 / 1.55 | Lede del hero de Home (max-width 540px) | L40 |
| `type.body.lede.game` | 16 / 400 / 1.5 | Bajada de pantalla de juego | L1106 |
| `type.body.statement` | 16 / 400 / 1.55 | Enunciado "qué debería hacer" | L648 |
| `type.body` | 15 / 400 / 1.5 | Descripción de tarjeta, "Cómo funciona" | L96, L248 |
| `type.body.explain` | 15 / 400 / 1.55 | Pasos de explicación numerados | L729, L909 |
| `type.body.sm` | 14 / 400 / 1.5 | Lista "cómo se juega", notas de Timeline y Big O | L691, L920, L1033 |
| `type.body.sm.legend` | 14 / 400 / 1.4 | Leyenda de pistas de Devdle | L483-485 |
| `type.body.sm.tight` | 14 / 400 / normal | Subtítulo de banner, etiqueta de stat-card, nota de racha | L619, L314, L311 |
| `type.caption` | 13 / 400 / 1.5 | Nota al pie de panel / texto de ayuda | L241, L498, L686, L1021, L1146 |
| `type.caption.tight` | 13 / 400 / normal | Etiqueta de mini-stat, nota junto a Confirmar | L225, L670 |
| `type.caption.definition` | 13 / 400 / 1.45 | Definición de palabra encontrada (Grep) | L1140 |
| `type.caption.xs` | 12 / 400 / normal | Etiqueta de métrica en tarjeta por juego | L346 |

`<b>` dentro de prosa Inter = 700, color `text.primary` (o el acento si el énfasis es la respuesta, L912).

### Interfaz y código (Mono)

| Token | Size / weight / lh | Uso | Fuente |
|---|---|---|---|
| `type.button.lg` | 15 / 700 (relleno) · 15 / 500 (outline) | Botón grande (48px) | L42, L43, L836 |
| `type.button.md` | 14 / 700 (relleno) · 14 / 500 (outline) | Botón mediano (44px), Compartir | L142, L100, L445 |
| `type.mono.body` | 14 / 400 / normal | Nav, prompt del hero, celdas de tabla, filas de test, link-flecha | L21, L38, L374, L683, L207 |
| `type.mono.strong` | 14 / 700 / normal | Píldora de racha, valores esperado/obtenido | L26, L714 |
| `type.mono.unit` | 16 / 400 / normal | Unidad "días" junto al número de racha de Stats | L310 |
| `type.mono.unit.compact` | 15 / 400 / normal | Unidad "días / seguidos" junto al número de racha de Home | L212 |
| `type.code` | 15 / 400 / 2 | Línea del bloque de código (`tab-size: 4`) | L807, L952 |
| `type.code.terminal` | 14 / 400 / 2 | Terminal del hero y diff | L54, L720 |
| `type.code.share` | 14 / 400 / 1.7 | Bloque "lo que compartís" (`white-space: pre-line`) | L742 |
| `type.label.comment` | 13 / 400 / normal | Etiqueta-comentario `// …` (rol más frecuente, ~40 usos), prompt `$ …` de Stats, metadato del header de juego, footer, hint de Grep, "racha N" en paneles | L70, L303, L440, L256, L1123 |
| `type.label.tab` | 13 / 400 (700 activa) | Pestaña de lenguaje | L817, L961 |
| `type.label.step` | 13 / 700 | Número de paso en cuadrado 28×28; números en caja "en números" | L729, L909, L916 |
| `type.meta` | 12 / 400 / normal | Badges, chips, fila de metadatos de tarjeta, caption de heatmap, nombre de archivo | L94, L97, L215, L658 |
| `type.meta.strong` | 12 / 700 | Botones ES/EN, tag de línea "◀ tu elección", marca "✓ bien" | L30, L806, L1063 |
| `type.meta.th` | 12 / 500 | Encabezado de tabla | L362-368 |
| `type.micro` | 11 / 400 | Leyenda del heatmap "0 … 4", años de la miniatura de Timeline | L221, L150 |
| `type.micro.xs` | 10 / 400 | Números de línea de la miniatura de Bug Hunt (decorativo) | L106 |

## Tokens

### Primitivos (`tokens/reference.md`)

`font.size.{10,11,12,13,14,15,16,18,19,20,22,24,26,28,30,32,34,40,56,64,88,96}`, `font.weight.{400,500,700,800}`, `font.lineHeight.{0.9,1,1.02,1.4,1.45,1.5,1.55,1.7,2,normal}`, `font.tracking.{-4,-2.5,-2,-1.5,-1,-0.5,0}`.

### Semánticos

Los roles `type.*` de arriba (definidos en `tokens/semantic.md`).

### De componente

Ejemplos: `button.lg.type → type.button.lg`, `panel.label.type → type.label.comment`, `streak-number.hero.type → type.display.streak`.

## Guidelines

**Do:**
- Declarar `font-family` Mono en cada pieza de interfaz; dejar Inter como base del documento.
- Usar tracking negativo solo donde la escala lo marca (display y títulos).
- Encabezar cada panel con `type.label.comment` (`// minúsculas`).
- Escribir números con la convención de cada idioma (`2,8`, `10.240` en ES) y tiempos `mm:ss`.

**Don't:**
- No poner títulos en Inter ni párrafos largos en Mono.
- No usar Inter 500/600 ni Mono 600 (no están en el DS).
- No usar `text-transform`.
- No dejar las ligaduras activas en texto Mono.
- No crear tamaños fuera de esta escala.

## Accesibilidad

- **Contraste:** todos los colores de texto de la escala sobre sus fondos están medidos en `foundations/color.md`.
- **Tamaño mínimo de lectura:** la prosa va de 12 a 19px. Los 10-11px solo aparecen en la leyenda del heatmap y en miniaturas decorativas (`aria-hidden`).
- **Zoom 200% y reflow a 320px (NFR-U01):** el texto tiene que poder crecer sin cortarse. **Adaptación requerida:** en un viewport de 320px el contenido útil mide 256px (gutter 32×2). `type.title.page` (40px) con "estadísticas" ocupa ~270px y desborda; el prototipo no define un tamaño menor. Requisito: ningún título desborda a 320px (corte de palabra o tamaño reducido); **Pendiente** la solución visual.
- **Interlineado:** la prosa usa 1.4-1.55; los títulos `normal` y los display 0.9-1.02 son de una o dos líneas cortas.
- **Espaciado de texto (WCAG 1.4.12):** los componentes no fijan alturas que corten texto cuando el usuario aumenta interlineado o tracking.

## Ejemplos

- `components/app-header.md` — `type.brand.logo`, `type.mono.body` (nav).
- `components/button.md` — `type.button.lg`, `type.button.md`.
- `components/panel.md` — `type.label.comment`, `type.caption`.
- `components/streak-number.md` — `type.display.streak`.
- `components/code-block.md` — `type.code`, `type.label.tab`.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-05 v1.0.0 — Reescrita desde el prototipo: Inter para prosa y JetBrains Mono para el resto, regla de uso, ligaduras desactivadas en Mono y escala completa de ~50 roles con valores y línea de origen. Se elimina la escala placeholder (`display`, `h1`…`caption`).
