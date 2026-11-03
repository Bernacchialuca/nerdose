# Design System — Changelog

Sigue el formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/)
y el versionado [Semantic Versioning](https://semver.org/lang/es/).

## [0.1.1] - 2026-11-03

### Cambiado
- `foundations/color.md`, `tokens/reference.md`, `tokens/semantic.md` y `tokens/component.md`: la paleta clara de relleno (por ejemplo `#ffffff`) se reemplaza por la paleta oscura del prototipo `docs/nerdose.html` (fondo `#0A0C0F`, texto `#E6EDF3`, acento `#3DDC84`), alineada con `@nerdose/ui/tokens.css`.
- Se agrega el semántico `border.interactive` para bordes de controles con contraste ≥3:1.

## [0.1.0] - 2026-11-03

### Agregado
- Estructura inicial del Design System (bootstrap automático).
- Archivos placeholder en foundations/, tokens/, guidelines/.
- Carpetas vacías components/ y patterns/.

> **Nota:** esta versión `0.1.0` es solo la estructura inicial. El primer DS
> "real" se versiona como `0.2.0` o superior cuando el equipo de diseño
> reemplace los placeholders con valores definitivos.

---

## Cómo registrar cambios

Cada vez que se ejecuta `/product-design-system-update`, el agente:

1. Aplica el cambio pedido.
2. Bumpea versión semver según naturaleza:
   - **MAJOR**: breaking (remover variant, renombrar componente)
   - **MINOR**: agregar (componente, variant, foundation)
   - **PATCH**: corrección, ajuste de spec
3. Agrega entrada en este CHANGELOG con formato:

```
## [X.Y.Z] - YYYY-MM-DD

### Agregado / Cambiado / Eliminado / Corregido / Deprecado
- {descripción concisa del cambio}
```
