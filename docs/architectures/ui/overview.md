# ui — Overview

## Proposito
Paquete `@nerdose/ui` (`packages/ui`): lo visual compartido entre `web` y `admin`. Contiene los tokens (`tokens.css` con el bloque `@theme` de Tailwind v4: fondo `#0A0C0F`, acento `#3DDC84`, `--font-mono`, acentos por juego), los componentes compartidos (header, banners, share, stat cards; desde REQ-003 también `Panel`, `Badge`, `StreakPill`, `StreakNumber`, `ProgressBar`, `TerminalWindow`, `SegmentedControl`; desde REQ-011 también `Heatmap`: 365 días con alternativa no cromática por celda), los helpers de clases `buttonClass` y `linkClass` y el helper `cn()`. Sin analítica: `track()` e `injectAnalytics()` se retiran en REQ-011 (S-058, ADR-014).

## Tipo de servicio
Library en React 19 (TypeScript estricto), sin build propio: exporta su fuente. Vive en `packages/ui`. No importa `@nerdose/db`.

## Modulos del dominio
- **tokens**: `tokens.css` con `@theme`; fuente única de los tokens visuales.
- **components**: componentes compartidos de `web` y `admin`.
- **utils**: `cn()`.

## Notas adicionales
- **Sin catálogo para `react`:** igual que `web` y `admin`, todas las convenciones son custom. `_base`, `styling`, `accessibility` y `testing-unit` son copias de las de `web` (con `library` agregado a `applies_to`); si se cambia una, hay que cambiar la otra.
- **Design System:** cuando `docs/design-system/` defina los tokens, mandan sobre los de `styling` y `tokens.css` debe actualizarse para coincidir.
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
