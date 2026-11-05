---
version: 1.0.0
last_updated: 2026-11-05
status: defined
---

# Governance del Design System — `web`

> Cómo se decide, se propone y se aplica un cambio al DS de `web`.

## Fuente de verdad

**`docs/nerdose.html` es la fuente de verdad visual del surface `web`** (PRD, NFR-U07). El DS formaliza sus valores en foundations, tokens y specs; las stories consumen el DS, no el HTML.

### Precedencia

| Tema | Gana | Detalle |
|---|---|---|
| Estética: color, tipografía, radios, espaciado, sombras, texturas, layout, componentes, tono | **El prototipo** | Ante una duda de estética, se mira el prototipo y se documenta en el DS con su línea `L###`. |
| Datos y métricas que se muestran, reglas de juego, textos | **El PRD** | P. ej. las estadísticas del prototipo pueden cambiar según C-34. |
| Accesibilidad (NFR-U01 a NFR-U05: WCAG 2.1 AA, foco visible, teclado, feedback no solo por color, 320px) | **El PRD** | Si el prototipo choca, se adapta **lo mínimo** y la adaptación queda documentada. |

### Reglas al documentar

1. **No inventar valores.** Todo valor cita su origen (`L###` del prototipo o la pantalla).
2. Lo que el prototipo no define se marca **"Pendiente — el prototipo no lo define"** (inputs, modales, toasts, hover de casi todo, foco, transiciones).
3. Un requisito de accesibilidad sin estética definida se declara como **requisito** (qué tiene que cumplirse) sin inventar el cómo.
4. Un choque entre prototipo y PRD se documenta con **el valor del prototipo + la adaptación requerida**, marcada como tal.
5. Las piezas que no existen en el prototipo pero el producto necesita (Alert, Banner `warning`) se declaran **adaptación de producto** y toman su estética de la pieza más cercana del prototipo.

## Quién puede modificar

- **Diseño:** cualquier cambio, siempre que respete la precedencia de arriba.
- **Desarrollo:** propone cambios; los aplica `/product-design-system-update`, o `/service-implement-story` cuando una story necesita una variant nueva. Una story **no puede apartarse del DS** sin cambiar antes el DS.

## Cómo proponer cambios

```bash
/product-design-system-update
```

Ejemplos: "definí el estilo de foco global", "agregá el estado hover del botón secundario", "resolvé la adaptación de 320px del tablero de Devdle". El agente aplica el cambio, agrega la entrada en `CHANGELOG.md`, actualiza el `## Historial` de cada archivo tocado y sube la versión.

## Versionado (semver, independiente de otros surfaces)

| Bump | Cuándo | Ejemplos |
|---|---|---|
| **MAJOR** | Breaking | Cambiar un valor existente de un token, renombrar/remover token, variant o componente, cambiar la API de un componente |
| **MINOR** | Adiciones compatibles | Componente, variant, token o foundation nuevos; resolver un "Pendiente" con un valor nuevo |
| **PATCH** | Correcciones | Errata de spec, microcopy, aclaraciones sin cambio de valores |

## Deprecación

1. Marcar `status: deprecated` en el frontmatter.
2. Nota en el CHANGELOG con el camino de migración.
3. Mantenerlo ≥ 1 MINOR antes del MAJOR que lo remueve.

## Wireframes y DS

Los wireframes mid-fi (`docs/ux/surfaces/web/`) son agnósticos del DS: declaran bloques con variants conceptuales. El puente ocurre en `/service-implement-story`, que mapea esos bloques a los specs de `docs/design-system/web/components/` y `patterns/`. Si un wireframe pide algo que el DS no soporta, se propone el cambio al DS antes de implementarlo.

## Código y DS

- Un cambio MAJOR del DS deja el código desalineado hasta que una story lo alinee; las diferencias conocidas se listan en el CHANGELOG ("Desalineaciones conocidas en código").
- `@nerdose/ui/tokens.css` es la implementación de los tokens; sus nombres siguen a los semánticos del DS.

## Historial

- 2026-11-03 v0.1.0 — Governance inicial (bootstrap).
- 2026-11-05 v1.0.0 — Se declara `docs/nerdose.html` fuente de verdad visual de `web`, con la precedencia prototipo (estética) / PRD (datos, reglas, accesibilidad), las reglas de documentación (no inventar, Pendiente, requisito, adaptación) y el criterio de MAJOR para cambios de valor.
