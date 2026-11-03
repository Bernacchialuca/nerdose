---
name: login
surface: admin
route: /login
viewports:
  - desktop
audiences:
  - responsable
fidelity: mid
status: diseñada
version: "1.0"
date: 2026-11-03
---

# Pantalla: P-01 · Login

## Identidad

- **Audiencia primaria:** [responsable](../../../audiences/responsable/research-context.md)
- **JTBD / Propósito:** Ingresar con la contraseña única; mostrar el motivo si el responsable volvió por sesión vencida o por límite de intentos.
- **Viewports:**
  - **desktop** — Formulario centrado (4/12) sobre el fondo oscuro; un solo campo y un solo envío. (único viewport de la superficie; no hay caso mobile relevado).

## Entrada y salida

**Entradas:**
- Cualquier ruta sin token (redirección)
- Petición con `401` (sesión vencida)
- «Cerrar sesión» del encabezado

**Salidas user-driven:**
- A `reportes` · «Ingresar» con credencial válida

**Salidas automáticas:**
- Ninguna.

## Estructura

| # | Nombre | Tipo | Variant/Level/State | Categoría | Viewports | Visibilidad | Propósito |
|---|--------|------|---------------------|-----------|-----------|-------------|-----------|
| 1 | header | header | — | layout | desktop | — | Marca del panel |
| 2 | titulo | heading | h1 | content | desktop | — | Título de la pantalla |
| 3 | subtitulo | paragraph | caption | content | desktop | — | Contexto |
| 4 | alerta-sesion | alert | warning | feedback | desktop | visible_only_in_states: sesión vencida | Motivo del regreso por sesión vencida |
| 5 | alerta-bloqueo | alert | warning | feedback | desktop | visible_only_in_states: bloqueado | Límite de 5 intentos por IP cada 15 min |
| 6 | alerta-sistema | alert | error | feedback | desktop | visible_only_in_states: error de sistema | Falla de red o de API (distinta de contraseña incorrecta) |
| 7 | campo-password | text-input | state=default | input | desktop | state_overrides: error de validación, bloqueado, loading | Contraseña única |
| 8 | btn-ingresar | button | variant=primary | input | desktop | state_overrides: loading, bloqueado | Envía la contraseña |

## Layout por viewport

### desktop · 1200px
- row `centrado`
  - col 4/12: (vacía)
  - col 4/12:
    - titulo
    - subtitulo
    - alerta-sesion
    - alerta-bloqueo
    - alerta-sistema
    - campo-password
    - btn-ingresar
  - col 4/12: (vacía)

> `header` es marco de la pantalla y no se lista en el layout.

## Contenido

### header
- Texto/label: > nerdose admin
- Icono: settings
- Annotation: nada

### titulo
- Texto/label: Ingresar
- Icono: nada
- Annotation: nada

### subtitulo
- Texto/label: Panel del responsable de nerdose.
- Icono: nada
- Annotation: nada

### alerta-sesion
- Texto/label: La sesión venció, ingresá de nuevo.
- Icono: nada
- Annotation: nada

### alerta-bloqueo
- Texto/label: Demasiados intentos. El acceso está bloqueado temporalmente; probá de nuevo en unos minutos.
- Icono: nada
- Annotation: nada

### alerta-sistema
- Texto/label: No pudimos conectarnos con el servidor. Probá de nuevo.
- Icono: nada
- Annotation: nada

### campo-password
- Texto/label: Contraseña
- Icono: lock
- Annotation: type=password; Enter envía
- Mensaje de error: Contraseña incorrecta.

### btn-ingresar
- Texto/label: Ingresar
- Icono: arrow-right
- Annotation: nada

## Estados

### default
- Aplica: Sí
- Mensaje: Ingresar
- Cambios:
  - ninguno respecto de default.

### sesión vencida
- Aplica: Sí
- Mensaje: La sesión venció, ingresá de nuevo.
- Cambios:
  - alerta-sesion: visible solo en este estado.

### error de validación
- Aplica: Sí
- Mensaje: Contraseña incorrecta.
- Cambios:
  - campo-password: state="error", error_msg="Contraseña incorrecta." (no revela más detalle).

### bloqueado
- Aplica: Sí
- Mensaje: Demasiados intentos. El acceso está bloqueado temporalmente; probá de nuevo en unos minutos.
- Cambios:
  - alerta-bloqueo: visible solo acá.
  - campo-password: state="disabled".
  - btn-ingresar: variant="disabled".

### loading
- Aplica: Sí
- Mensaje: Ingresando…
- Cambios:
  - campo-password: disabled.
  - btn-ingresar: variant="disabled", content="Ingresando…".

### error de sistema
- Aplica: Sí
- Mensaje: No pudimos conectarnos con el servidor. Probá de nuevo.
- Cambios:
  - alerta-sistema: visible solo acá; el campo queda editable para reintentar.

## Interacciones

**Eventos:**
- campo-password · on Enter → envía
- btn-ingresar · on click → `POST /api/admin/login`; con éxito guarda el token (8 h) en `sessionStorage` y navega a `reportes`

**Validaciones:**
- Campo vacío: no envía y marca el campo.
- Credencial inválida: mensaje genérico, sin detalle (NFR-S07).

**Feedback:**
- El bloqueo informa que es temporal; no muestra tiempo restante (no está definido en el PRD).
- Error de red se distingue de contraseña incorrecta y no cuenta como intento fallido (supuesto, a confirmar con `api`).

## Accesibilidad

- **Orden de foco:** campo-password → btn-ingresar.
- **Landmarks y jerarquía:** `main` con un h1; los avisos son `role="alert"`.
- **Foco y teclado:** el foco arranca en el campo; Enter envía.

## Decisiones y descartes

**Decisiones tomadas:**
- Un solo campo, sin «usuario»: es una contraseña única (C-38).
- Avisos como alertas inline sobre el campo, no como modal: el login es la pantalla de destino de la sesión vencida.

**Alternativas descartadas:**
- Volver a la ruta anterior tras el login: no definido, el login lleva siempre a `reportes` (pregunta abierta 3 del product-map).

**Preguntas abiertas:**
- ¿Mostrar el tiempo restante del bloqueo? El PRD no lo define.

## Trazabilidad

- C-38, NFR-S07 · flujo 1 de `user-flows.md`.
