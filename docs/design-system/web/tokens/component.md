---
tokens: component
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Tokens — Component-level

## Propósito

Tier 3: cada token nombra **una propiedad de un componente** y apunta a un semántico (`tokens/semantic.md`). Formato: `{componente}.{variant}.{propiedad}[.{estado}]`. `{j}` = id del juego (`devdle`, `bug-hunt`, `big-o`, `timeline`, `grep-grid`). Un valor **Pendiente** no se implementa hasta que el DS lo defina.

## Button (`components/button.md`)

```
button.radius                  : radius.control            # 10px (L42…)
button.lg.height.min           : size.control.lg           # 48
button.lg.padding-x            : space.22
button.lg.gap                  : space.10
button.lg.type                 : type.button.lg
button.md.height.min           : size.control.md           # 44
button.md.padding-x            : space.16
button.md.gap                  : gap.inline.control        # 8
button.md.type                 : type.button.md
button.share.padding-x         : space.14

button.primary.bg              : accent.brand
button.primary.text            : accent.brand.on
button.primary.weight          : 700

button.secondary.bg            : transparent
button.secondary.border        : border.control
button.secondary.text          : text.primary
button.secondary.weight        : 500

button.accent.bg               : game.{j}.accent
button.accent.text             : game.{j}.on
button.accent.weight           : 700

button.outline-tinted.border   : status.error.border       # banner de fallo (L634)
                               | game.timeline.rail        # Timeline (L1043)
button.outline-tinted.text     : text.primary
button.outline-tinted.weight   : 500                       # ver decisión en button.md

button.ghost.border            : border.control            # dashed
button.ghost.text              : text.muted
button.ghost.height.min        : size.control.sm           # 40
button.ghost.padding-x         : space.14
button.ghost.type              : type.label.comment        # 13/400

button.icon.size               : size.control.md           # 44×44
button.icon.bg                 : bg.control
button.icon.border             : border.control
button.icon.color              : text.body
button.icon.glyph              : icon.size.md              # 18

button.disabled.bg             : bg.control
button.disabled.border         : border.control
button.disabled.text           : text.disabled
button.accent.disabled.bg      : game.bug-hunt.disabled.bg     # solo definido para Bug Hunt
button.accent.disabled.text    : game.bug-hunt.disabled.text

button.hover.*                 : Pendiente — el prototipo no lo define
button.focus.outline           : focus.ring.color / focus.ring.width   # requisito; estética Pendiente
```

## Link (`components/link.md`)

```
link.color                     : accent.brand | game.{j}.accent
link.color.hover               : accent.brand.hover | game.{j}.hover
link.arrow.type                : type.mono.body
link.arrow.padding-y           : space.12
link.subtle.color              : text.body
link.subtle.type               : type.label.comment        # 13
link.subtle.padding-y          : space.8
link.subtle.color.hover        : Pendiente — el prototipo no lo define
link.decoration                : none
```

## Card (`components/card.md`)

```
card.game.bg                   : bg.surface
card.game.border               : border.default
card.game.radius               : radius.feature            # 16
card.game.padding              : inset.card                # 20
card.game.gap                  : gap.stack.panel           # 12
card.game.thumb.height         : size.150
card.game.thumb.bg             : game.{j}.tint
card.game.thumb.border         : game.{j}.tint-border      # border-bottom
card.game.title.type           : type.title.card
card.game.title.color          : game.{j}.accent
card.game.desc.type            : type.body
card.game.desc.color           : text.lede
card.game.meta.type            : type.meta
card.game.meta.color           : text.dim
card.game.meta.gap             : gap.inline.meta           # 14
card.game.meta.streak.color    : streak.text

card.next.border               : game.{j}.featured-border  # solo big-o definido
card.next.shadow               : elevation.featured.{j}    # solo big-o definido

card.placeholder.border        : border.control            # dashed
card.placeholder.radius        : radius.feature
card.placeholder.padding       : inset.panel.lg            # 28
card.placeholder.min-height    : size.300

card.step.border               : border.subtle
card.step.radius               : radius.panel              # 14
card.step.padding              : inset.step                # 22
card.step.kicker.type          : type.mono.body
card.step.text.type            : type.body
card.step.text.color           : text.body

card.mini-stat.bg              : bg.surface.inset
card.mini-stat.radius          : radius.inset              # 12
card.mini-stat.padding         : inset.box
card.mini-stat.value.type      : type.numeric.md
card.mini-stat.label.type      : type.caption.tight
card.mini-stat.label.color     : text.muted

card.stat.bg                   : bg.surface
card.stat.border               : border.default
card.stat.radius               : radius.panel
card.stat.padding              : inset.card
card.stat.value.type           : type.numeric.xl
card.stat.label.type           : type.body.sm.tight
card.stat.label.color          : text.muted

card.metric.bg                 : bg.surface.inset
card.metric.radius             : radius.control            # 10
card.metric.padding            : space.12
card.metric.value.type         : type.numeric.sm
card.metric.label.type         : type.caption.xs

card.counter.bg                : bg.surface
card.counter.border            : border.default
card.counter.radius            : radius.inset
card.counter.padding           : space.12 space.18
card.counter.value.type        : type.numeric.lg
card.counter.value.color       : text.primary | game.{j}.accent
card.counter.label.type        : type.meta

card.game-stats.bg             : bg.surface
card.game-stats.border         : border.default
card.game-stats.radius         : radius.panel
card.game-stats.top-bar        : game.{j}.accent           # 4px
card.game-stats.padding        : inset.card
card.game-stats.gap            : gap.grid.compact          # 16
card.game-stats.title.type     : type.title.card.compact
```

## Panel (`components/panel.md`)

```
panel.bg                       : bg.surface
panel.border                   : border.default
panel.radius                   : radius.panel              # 14
panel.padding                  : inset.card                # 20
panel.gap                      : gap.stack.panel           # 12 (14 en paneles con lista)
panel.label.type               : type.label.comment
panel.label.color              : text.dim
panel.datum.color              : streak.text               # "racha N"
panel.note.type                : type.caption
panel.note.color               : text.muted

panel.feature.radius           : radius.feature            # 16
panel.feature.padding          : inset.panel.lg            # 28

panel.explain.padding          : inset.panel.explain       # 24

panel.context.bg               : streak.surface
panel.context.border           : streak.border
panel.context.padding          : inset.panel.context
panel.context.label.color      : streak.label
panel.context.text.type        : type.body.statement

panel.box.radius               : radius.inset              # 12
panel.box.padding              : inset.box
panel.box.neutral.bg           : bg.surface.inset
panel.box.sunken.bg            : bg.surface.sunken
panel.box.sunken.border        : border.default
panel.box.error.bg             : status.error.bg
panel.box.error.border         : status.error.border
panel.box.game.bg              : game.big-o.tint           # "en números" (solo Big O)
panel.box.game.border          : game.big-o.tint-border
```

## Banner (`components/banner.md`)

```
banner.radius                  : radius.panel
banner.padding                 : inset.banner
banner.gap                     : space.16
banner.icon.size               : size.40
banner.icon.glyph              : icon.size.lg / icon.stroke.bold
banner.title.type              : type.title.banner
banner.title.color             : text.primary
banner.subtitle.type           : type.body.sm.tight

banner.success.bg              : status.success.bg
banner.success.border          : status.success.border
banner.success.icon.bg         : status.success
banner.success.icon.color      : status.success.on
banner.success.subtitle.color  : status.success.text-soft
banner.success.action          : button.primary (md)

banner.failure.bg              : status.error.bg
banner.failure.border          : status.error.border
banner.failure.icon.bg         : status.error
banner.failure.icon.color      : status.error.on
banner.failure.subtitle.color  : status.error.text-soft
banner.failure.action          : button.outline-tinted (status.error.border)

banner.neutral.bg              : bg.surface
banner.neutral.border          : border.default
banner.neutral.text.type       : type.mono.body
banner.neutral.text.color      : text.muted
banner.neutral.action          : button.outline-tinted (game.{j}.rail)

banner.warning.bg              : status.warning.bg          # adaptación
banner.warning.border          : status.warning.border
banner.warning.subtitle.color  : status.warning.text-soft
banner.warning.icon            : Pendiente — el prototipo no lo define
```

## Alert (`components/alert.md`) — adaptación

```
alert.bg                       : status.error.bg
alert.border                   : status.error.border
alert.radius                   : radius.panel
alert.padding                  : inset.banner
alert.gap                      : space.16
alert.icon.bg                  : status.error
alert.icon.color               : status.error.on
alert.title.type               : type.title.banner
alert.title.color              : text.primary
alert.detail.type              : type.body.sm.tight
alert.detail.color             : status.error.text-soft
alert.action                   : button.outline-tinted (status.error.border)
```

## App header (`components/app-header.md`)

```
app-header.padding             : inset.header.global       # 18 32
app-header.gap                 : space.16
app-header.border-bottom       : border.subtle
app-header.bg                  : bg.header                 # solo sobre la textura de Home
app-header.logo.type           : type.brand.logo
app-header.logo.color          : text.primary
app-header.logo.prompt.color   : accent.brand              # ">" y "_"
app-header.logo.cursor         : motion.cursor
app-header.nav.gap             : space.4
app-header.nav.item.padding    : space.12 space.14
app-header.nav.item.radius     : radius.tile
app-header.nav.item.type       : type.mono.body
app-header.nav.item.color      : text.muted
app-header.nav.item.active.bg  : bg.nav.active
app-header.nav.item.active.color : text.primary
app-header.actions.gap         : space.10
```

## Game header (`components/game-header.md`)

```
game-header.padding            : inset.header.game         # 14 32
game-header.gap                : space.16
game-header.border-bottom      : border.subtle
game-header.crumbs.gap         : space.18
game-header.logo.type          : type.brand.logo.compact
game-header.separator.color    : text.separator
game-header.crumb.type         : type.brand.crumb
game-header.crumb.color        : game.{j}.accent
game-header.meta.type          : type.label.comment
game-header.meta.color         : text.dim
game-header.actions.gap        : gap.inline.control        # 8
```

## Site footer (`components/site-footer.md`)

```
site-footer.padding            : inset.footer              # 24 32
site-footer.gap                : space.12
site-footer.border-top         : border.subtle
site-footer.type               : type.label.comment        # 13
site-footer.color              : text.dim
```

## Language selector (`components/language-selector.md`)

```
language-selector.padding      : space.3
language-selector.gap          : space.2
language-selector.border       : border.control
language-selector.radius       : radius.control            # 10
language-selector.bg           : bg.control
language-selector.segment.height    : size.36
language-selector.segment.min-width : size.40
language-selector.segment.radius    : radius.segment       # 7
language-selector.segment.type      : type.meta.strong
language-selector.segment.bg        : transparent
language-selector.segment.color     : text.muted
language-selector.segment.active.bg    : bg.control.selected
language-selector.segment.active.color : text.primary
language-selector.segment.active.indicator : Pendiente — adaptación WCAG 1.4.11
```

## Streak pill (`components/streak-pill.md`)

```
streak-pill.padding            : space.10 space.14
streak-pill.gap                : gap.inline.control        # 8
streak-pill.radius             : radius.pill
streak-pill.bg                 : streak.bg
streak-pill.border             : streak.border
streak-pill.color              : streak.text
streak-pill.type               : type.mono.strong          # 14/700
streak-pill.icon               : icon.size.sm (flame)
streak-inline.color            : streak.text
streak-inline.type             : type.label.comment | type.meta
```

## Chip y badge (`components/chip.md`)

```
chip.radius                    : radius.pill
chip.type                      : type.meta
chip.padding                   : space.6 space.10
chip.padding.loose             : space.6 space.12
chip.neutral.border            : border.control
chip.neutral.color             : text.muted
chip.accent.border             : game.bug-hunt.chip-border
chip.accent.color              : game.bug-hunt.accent

badge.radius                   : radius.pill
badge.type                     : type.meta
badge.padding                  : space.4 space.10
badge.success.bg               : status.success.badge.bg
badge.success.color            : status.success.badge.text
badge.pending.bg               : status.pending.badge.bg
badge.pending.color            : status.pending
badge.strong.weight            : 700                       # marcas de Timeline
```

## Streak number (`components/streak-number.md`)

```
streak-number.gap              : space.10
streak-number.hero.type        : type.display.streak
streak-number.compact.type     : type.display.streak.compact
streak-number.value.color      : streak.text
streak-number.hero.unit.color  : streak.label
streak-number.compact.unit.color : text.lede
streak-number.compact.unit.type  : type.mono.unit.compact  # 15/400, L212
streak-number.hero.unit.type   : type.mono.unit          # 16/400, L310
streak-number.score.type       : type.display.score
streak-number.score.color      : game.{j}.accent
streak-number.score.label.color: text.lede
streak-card.bg                 : streak.surface
streak-card.border             : streak.border
streak-card.radius             : radius.feature
streak-card.padding            : inset.streak
streak-card.gap                : space.10
streak-card.label.color        : streak.label
streak-card.note.color         : streak.note
streak-card.note.type          : type.body.sm.tight
```

## Heatmap (`components/heatmap.md`)

```
heatmap.level.{0..4}           : data.heatmap.{0..4}
heatmap.caption.type           : type.meta
heatmap.caption.color          : text.dim
heatmap.month.cell.height      : size.22
heatmap.month.cell.radius      : radius.cell.xs            # 4
heatmap.month.gap              : space.5
heatmap.month.legend.cell      : size.12 / radius.micro
heatmap.month.legend.type      : type.micro
heatmap.quarter.cell.size      : size.14
heatmap.quarter.cell.radius    : radius.micro              # 3
heatmap.quarter.gap            : space.4
```

## Progress bar (`components/progress-bar.md`)

```
progress.segmented.segment.width  : size.36
progress.segmented.segment.height : 6px
progress.segmented.gap            : space.6
progress.segmented.radius         : radius.pill
progress.segmented.done           : accent.brand
progress.segmented.pending        : bg.control.selected
progress.streak.track.height      : space.8
progress.streak.track.bg          : bg.track
progress.streak.fill              : game.{j}.accent
progress.streak.radius            : radius.pill
progress.streak.label.type        : type.mono.body
progress.streak.days.color        : text.lede
```

## Terminal window (`components/terminal-window.md`)

```
terminal.bg                    : bg.surface
terminal.border                : border.default
terminal.radius                : radius.panel
terminal.shadow                : elevation.window
terminal.bar.bg                : bg.titlebar
terminal.bar.border            : border.subtle
terminal.bar.padding           : space.12 space.16
terminal.bar.dot               : size.11 / bg.window-dot
terminal.bar.title.type        : type.meta
terminal.bar.title.color       : text.dim
terminal.body.padding          : space.22 space.22 space.24
terminal.body.type             : type.code.terminal
terminal.row.gap               : space.14
terminal.done.color            : status.success
terminal.pending.color         : status.pending
terminal.separator             : border.control (dashed, top)
terminal.cursor                : motion.cursor / accent.brand
```

## Code block (`components/code-block.md`)

```
code-block.bg                  : bg.surface.sunken
code-block.border              : border.default
code-block.radius              : radius.panel
code-block.tabs.bg             : bg.toolbar
code-block.tabs.border         : border.subtle
code-block.tabs.padding        : space.8
code-block.tabs.gap            : space.4
code-block.tab.height.min      : size.control.sm           # 40
code-block.tab.padding-x       : space.16
code-block.tab.radius          : radius.tile
code-block.tab.type            : type.label.tab
code-block.tab.color           : text.muted
code-block.tab.selected.bg     : game.bug-hunt.tint-strong | game.big-o.tab-selected
code-block.tab.selected.color  : game.bug-hunt.accent      | text.primary
code-block.filename.type       : type.meta
code-block.filename.color      : text.dim
code-block.line.type           : type.code
code-block.line.padding-x      : space.18
code-block.line.height.min     : size.control.sm           # 40 (líneas interactivas)
code-block.line.color          : text.primary
code-block.line-number.color   : text.line-number          # requiere adaptación
code-block.line-number.width   : 30px
code-block.line.highlight.bg   : game.{j}.line-highlight | game.{j}.tint
code-block.line.highlight.bar  : bar.{game.{j}.accent}
code-block.annotation.type     : type.meta
code-block.annotation.color    : game.big-o.light
code-block.diff.radius         : radius.inset
code-block.diff.type           : type.code.terminal
code-block.diff.remove.bg      : status.error.bg
code-block.diff.remove.color   : status.error.diff-text
code-block.diff.add.bg         : status.success.bg
code-block.diff.add.color      : status.success.diff-text
```

## Data table (`components/data-table.md`)

```
data-table.bg                  : bg.surface
data-table.border              : border.default
data-table.radius              : radius.panel
data-table.type                : type.mono.body
data-table.th.type             : type.meta.th
data-table.th.color            : text.dim | game.{j}.accent
data-table.th.border           : border.subtle
data-table.cell.padding        : space.14 space.20
data-table.td.border           : border.row
data-table.date.color          : text.muted
data-table.min-width           : 640px
```

## Patterns de juego (`patterns/game-boards.md`)

```
devdle.cell.size               : size.64
devdle.cell.radius             : radius.tile
devdle.cell.type               : type.game.tile.lg
devdle.cell.correct.bg         : status.success
devdle.cell.correct.color      : status.success.on
devdle.cell.present.border     : status.present (2px dashed)
devdle.cell.present.color      : status.present
devdle.cell.absent.bg          : status.absent.bg
devdle.cell.absent.color       : status.absent.text
devdle.cell.typed.bg           : bg.surface
devdle.cell.typed.border       : border.emphasis
devdle.cell.empty.border       : border.default
devdle.key.height              : size.54
devdle.key.radius              : radius.tile
devdle.key.type                : type.game.key
devdle.key.bg                  : bg.control.selected
devdle.key.correct.bg          : status.success
devdle.key.discarded.bg        : bg.discarded
devdle.key.discarded.color     : text.discarded            # requiere adaptación
devdle.key.enter.bg            : accent.brand
devdle.distribution.bar.radius : radius.cell.xs
devdle.distribution.highlight  : status.success

bug-hunt.line.selected.bg      : game.bug-hunt.tint
bug-hunt.line.hover.bg         : game.bug-hunt.tint-hover
bug-hunt.line.correct.bg       : status.success.bg
bug-hunt.line.wrong.bg         : status.error.bg
bug-hunt.line.ineligible.color : text.dim
bug-hunt.test.pass.bg          : bg.surface.inset
bug-hunt.test.hidden.border    : status.error.border (dashed)
bug-hunt.step.size             : size.28
bug-hunt.step.bg               : game.bug-hunt.tint-strong
bug-hunt.step.color            : game.bug-hunt.accent

big-o.option.height.min        : size.56
big-o.option.radius            : radius.control
big-o.option.type              : type.game.option
big-o.option.bg                : bg.surface
big-o.option.border            : border.subtle
big-o.option.color             : text.dim
big-o.option.selected.bg       : status.success
big-o.option.selected.color    : status.success.on
big-o.step.bg                  : game.big-o.tint-strong
big-o.step.color               : game.big-o.light

timeline.row.height.min        : size.52
timeline.row.radius            : radius.control
timeline.row.correct.bg        : status.success.row-bg
timeline.row.correct.border    : status.success.border
timeline.row.misplaced.bg      : status.misplaced.bg
timeline.row.misplaced.border  : status.misplaced.border (dashed)
timeline.rail.color            : game.timeline.rail
timeline.node.size             : size.12
timeline.node.color            : game.timeline.accent
timeline.year.type             : type.numeric.year

grep-grid.board.bg             : bg.surface.sunken
grep-grid.board.radius         : radius.feature
grep-grid.cell.size            : size.48
grep-grid.cell.radius          : radius.tile
grep-grid.cell.type            : type.game.tile.md
grep-grid.cell.bg              : bg.surface.inset
grep-grid.cell.color           : text.body
grep-grid.cell.start.bg        : game.grep-grid.selected-bg
grep-grid.cell.start.border    : game.grep-grid.accent
grep-grid.cell.start.color     : game.grep-grid.hover
grep-grid.cell.found.bg        : game.grep-grid.accent
grep-grid.cell.found.color     : game.grep-grid.on
grep-grid.word.found.bg        : game.grep-grid.found-bg
grep-grid.word.found.border    : game.grep-grid.found-border
grep-grid.word.found.color     : game.grep-grid.hover
grep-grid.hint.type            : type.label.comment
grep-grid.hint.color           : text.dim
```

## Reglas

- **Cada componente declara sus tokens al documentarse.**
- **Cambiar el valor de un token de componente** = PATCH si es ajuste fino; MINOR si agrega subtoken.
- **Renombrar/remover** = MAJOR.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-03 v0.1.1 — Referencias a colores ajustadas a la paleta oscura.
- 2026-11-05 v0.2.0 — Button, Card y Alert alineados con la implementación de REQ-002; tokens de `alert.*` y `banner.*`.
- 2026-11-05 v1.0.0 — Remapeo completo desde el prototipo. `button.radius` pasa de `radius.none` a `radius.control` (10px); Button suma tamaños `lg`/`md` y variants `accent`, `outline-tinted`, `ghost`, `icon`. Card pasa a `card.game.*` con padding 20 y suma `next`, `placeholder`, `step` y las tarjetas de stat. Alert y Banner pasan a la estética del banner de resultado (borde 1px, radio 14, tinte). Nuevos: link, panel, app-header, game-header, site-footer, language-selector, streak-pill, chip/badge, streak-number, heatmap, progress-bar, terminal, code-block, data-table y piezas de juego. Eliminados: `input.*` (no hay inputs en el prototipo), `button.destructive.*`, `button.height.min`, `button.padding.x`, `button.gap`, `card.elevation`, `alert.border` lateral de 4px, `banner.padding.y/x`.
