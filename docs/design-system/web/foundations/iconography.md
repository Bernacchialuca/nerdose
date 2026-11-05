---
foundation: iconography
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Iconografía

## Propósito

Define los tres recursos iconográficos del prototipo `docs/nerdose.html`: SVG inline estilo Lucide, caracteres Unicode tipográficos (en JetBrains Mono) y tres emojis permitidos. Las ilustraciones de las tarjetas no son imágenes: son mini-maquetas de cada juego hechas con divs (ver `patterns/game-boards.md`).

## Inventario

### 1. SVG estilo Lucide

Atributos fijos: `viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"`. El color sale de `currentColor`.

| Ícono | Tamaño | Stroke | Dónde | Fuente |
|---|---|---|---|---|
| `flame` (llama) | 16×16 | 2 | Píldora de racha | L27, L447 |
| `circle-help` | 18×18 | 2 | Botón-ícono "Cómo se juega" | L443 |
| `chart` (ejes + 3 barras: `M3 3v18h18`, `M8 17V11`, `M13 17V7`, `M18 17v-4`) | 18×18 | 2 | Botón-ícono "Estadísticas" | L444 |
| `share` (caja + flecha arriba) | 16×16 | 2 | Botón Compartir | L445 |
| `check` (`M20 6 9 17l-5-5`) | 20×20 | **3** | Círculo del banner de éxito | L616, L870 |
| `x` | 20×20 | **3** | Círculo del banner de fallo | L628 |

| Token | Valor |
|---|---|
| `icon.size.sm` | 16px (dentro de píldora y botón con texto) |
| `icon.size.md` | 18px (botón-ícono 44×44) |
| `icon.size.lg` | 20px (círculo de banner de 40×40) |
| `icon.stroke.default` | 2 |
| `icon.stroke.bold` | 3 (solo íconos de resultado dentro de un círculo relleno) |

### 2. Caracteres Unicode (Mono, heredan color)

| Carácter | Significado | Fuente |
|---|---|---|
| `>` | Prompt / logo; prefijo de hints | L19, L1123 |
| `_` | Cursor del logo (parpadea en Home) | L19 |
| `▌` | Cursor de bloque de la terminal (parpadea) | L62 |
| `$` | Prompt de comando | L38, L303 |
| `//` | Comentario: título de panel | L70… |
| `✓` | Hecho / correcto | L56, L94 |
| `✗` | Error | L374, L1062 |
| `○` | Pendiente (terminal) | L58 |
| `→` | Avance / CTA (`aria-hidden` cuando es decorativo) | L42 |
| `▲` | Racha en metadatos de tarjeta | L98 |
| `◀` | Tag "tu elección" | L788 |
| `↺` | Reiniciar | L745 |
| `⌫` | Borrar (tecla) | L571 |
| `·` | Separador de metadatos (omnipresente) | — |
| `—` | Vacío (tabla, terminal) | L57, L374 |
| `²` `³` `ⁿ` `₂` `×` `−` `…` | Notación matemática tipográfica (no `<sup>`) | L964, L909 |

### 3. Emojis (solo estos tres)

| Emoji | Uso | Fuente |
|---|---|---|
| `🐛` | Miniatura de Bug Hunt, tag "🐛 acá estaba el bug", texto compartido | L108, L792, L840 |
| `🟩` / `🟥` | Resultado compartido en cuadraditos | L840 |

## Tokens

Semánticos: `icon.size.*`, `icon.stroke.*`. De componente: `button.icon.size → icon.size.md`, `streak-pill.icon.size → icon.size.sm`, `banner.icon.size → icon.size.lg`.

## Guidelines

**Do:**
- Dibujar íconos nuevos con la misma grilla Lucide (24, stroke 2, extremos redondeados).
- Preferir un carácter Unicode en Mono antes que un SVG cuando el prototipo ya lo usa para ese significado.
- Marcar `aria-hidden` el ícono y dar el nombre accesible al control (`aria-label`).

**Don't:**
- No usar otros emojis en la interfaz.
- No usar íconos rellenos ni de otro set.
- No usar stroke 3 fuera de los íconos de resultado.

## Accesibilidad

- Todo SVG es `aria-hidden`; el botón que lo contiene lleva `aria-label` ("Cómo se juega", "Estadísticas", L443-444).
- Los caracteres con significado (`✓`, `✗`, `○`) nunca son la única vía: van con texto ("resuelto", "pendiente") o con `aria-label` en la celda.
- `→` de los CTA es decorativo (`aria-hidden`, L42): la etiqueta tiene que entenderse sin él.
- Los emojis del texto compartido se leen en voz alta; el texto compartido lleva palabras ("bug encontrado", "se me escapó", L840).

## Ejemplos

- `components/streak-pill.md`, `components/button.md` (variant `icon`, Compartir), `components/banner.md`.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-05 v1.0.0 — Inventario real: 6 SVG estilo Lucide (16/18/20, stroke 2/3), caracteres Unicode con significado y los 3 emojis permitidos.
