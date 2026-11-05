---
version: 1.0.0
last_updated: 2026-11-05
status: defined
---

# Patterns del Design System — `web`

Los patterns son composiciones o piezas que resuelven un caso concreto. En `web`, las piezas propias de un solo juego viven acá en lugar de en `components/`.

## Patterns documentados

| Pattern | Contenido | Estado | Implementado |
|---|---|---|---|
| [game-boards](game-boards.md) | Celdas, teclas, filas, opciones y miniaturas de Devdle, Bug Hunt, Big O, Tech Timeline y Grep Grid | active | No (FG-3 en adelante) |

## Diferencia entre componente y pattern

- **Componente** (`components/`): unidad reusable en varias pantallas (Button, Panel, Card).
- **Pattern** (`patterns/`): composición de componentes o pieza de un solo juego, con convención `{juego}.{pieza}`.

## Pendientes

Formularios, estados vacíos, carga y modales (overlay O-01) no existen en el prototipo `docs/nerdose.html`: **Pendiente — el prototipo no los define**. Se documentan cuando una story los necesite, vía `/product-design-system-update`.

## Historial

- 2026-11-05 v1.0.0 — Se agrega `game-boards.md`; se listan los patterns que el prototipo no define.
