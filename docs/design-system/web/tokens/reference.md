---
tokens: reference
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Tokens — Reference (primitivos)

## Propósito

Tier 1 de la jerarquía de tokens: el **inventario crudo** de valores del prototipo `docs/nerdose.html`. No se consumen desde componentes; siempre vía `tokens/semantic.md`.

```
Reference (primitivos)  ←  ESTE NIVEL
        ↓
Semantic (rol)
        ↓
Component (por componente)
```

Convención de nombres de color: `color.{matiz}.{nnn}`, donde `nnn` crece hacia lo oscuro (975 casi negro, 100 casi blanco). `{matiz}.dim.{nnn}` son tonos desaturados del mismo matiz. `-aNN` indica alfa (NN %). Todos los valores salen del prototipo; la línea de origen está en `foundations/color.md`.

## Color

### Neutros

```
color.neutral.950     : #0A0C0F
color.neutral.950-a92 : rgba(10,12,15,0.92)
color.neutral.925     : #0D1116
color.neutral.900     : #0F1318
color.neutral.850     : #11151A
color.neutral.840     : #11161C
color.neutral.835     : #12161B
color.neutral.830     : #12171D
color.neutral.800     : #141920
color.neutral.790     : #161B22
color.neutral.775     : #1A2028
color.neutral.770     : #1A2029
color.neutral.750     : #1E252E
color.neutral.700     : #222A33
color.neutral.650     : #2A323C
color.neutral.600     : #3A424C
color.neutral.550     : #4F5A66
color.neutral.525     : #5A6573
color.neutral.510     : #5F6B78
color.neutral.500     : #6B7682
color.neutral.400     : #8D99A6
color.neutral.300     : #9AA6B2
color.neutral.250     : #A9B4BF
color.neutral.200     : #C3CCD5
color.neutral.100     : #E6EDF3
color.black-a45       : rgba(0,0,0,0.45)
```

### Verde (marca, Devdle, éxito, heatmap)

```
color.green.975     : #06120B
color.green.960     : #0C1A12
color.green.955     : #0E1A13
color.green.900     : #12301F
color.green.890     : #16301F
color.green.850     : #1E3A28
color.green.800     : #1E4A30
color.green.700     : #14532D
color.green.600     : #1F8F4E
color.green.550     : #2FBF6B
color.green.500     : #3DDC84
color.green.300     : #7CF0B0
color.green.200     : #9EF0C2
color.green.dim.300 : #A9C9B5
```

### Ámbar (Bug Hunt, racha, pendiente, advertencia)

```
color.amber.975     : #140F07
color.amber.970     : #15110A
color.amber.960     : #1A1206
color.amber.955     : #17130B
color.amber.950     : #1A140A
color.amber.900     : #2A1F0B
color.amber.880     : #33260F
color.amber.860     : #3A2A12
color.amber.850     : #3A2C14
color.amber.800     : #5C4419
color.amber.700     : #7A5A2A
color.amber.500     : #FFB547
color.amber.300     : #FFD08A
color.amber.dim.900 : #2A2416
color.amber.dim.600 : #8A7856
color.amber.dim.400 : #C9A46A
color.amber.dim.300 : #C9B48F
```

### Azul (Big O)

```
color.blue.975     : #06121F
color.blue.960     : #0B1522
color.blue.950     : #0E1D2E
color.blue.920     : #11243A
color.blue.900     : #1D2A3A
color.blue.890     : #1B2E45
color.blue.850     : #23405F
color.blue.800     : #2E4C6E
color.blue.500     : #5EB1FF
color.blue.500-a20 : #5EB1FF33
color.blue.300     : #8CC8FF
color.blue.200     : #9ACFFF
color.blue.dim.400 : #7FA7CF
color.blue.glow-a25: rgba(20,60,110,0.25)
```

### Violeta (Tech Timeline)

```
color.purple.975 : #160E26
color.purple.970 : #161024
color.purple.900 : #2B2045
color.purple.850 : #3C2E60
color.purple.550 : #B596E6
color.purple.500 : #C39BFF
color.purple.300 : #DCC4FF
```

### Rosa (Grep Grid)

```
color.pink.975     : #1A0B16
color.pink.970     : #24081A
color.pink.960     : #1F0D19
color.pink.950     : #2A0F22
color.pink.900     : #3A1530
color.pink.850     : #5B2147
color.pink.500     : #F472B6
color.pink.300     : #F9A8D4
color.pink.dim.600 : #8A5C7A
```

### Rojo (error)

```
color.red.975     : #1C0605
color.red.960     : #1C0F0E
color.red.850     : #4A2220
color.red.500     : #FF7B72
color.red.300     : #FFB3AD
color.red.dim.300 : #D9B3AF
```

## Tipografía

```
font.family.sans : 'Inter', system-ui, sans-serif
font.family.mono : 'JetBrains Mono', monospace

font.size.10 : 10px
font.size.11 : 11px
font.size.12 : 12px
font.size.13 : 13px
font.size.14 : 14px
font.size.15 : 15px
font.size.16 : 16px
font.size.18 : 18px
font.size.19 : 19px
font.size.20 : 20px
font.size.22 : 22px
font.size.24 : 24px
font.size.26 : 26px
font.size.28 : 28px
font.size.30 : 30px
font.size.32 : 32px
font.size.34 : 34px
font.size.40 : 40px
font.size.56 : 56px
font.size.64 : 64px
font.size.88 : 88px
font.size.96 : 96px

font.weight.400 : 400
font.weight.500 : 500   # solo Mono
font.weight.700 : 700
font.weight.800 : 800   # solo Mono

font.lineHeight.0_9    : 0.9
font.lineHeight.1      : 1
font.lineHeight.1_02   : 1.02
font.lineHeight.1_4    : 1.4
font.lineHeight.1_45   : 1.45
font.lineHeight.1_5    : 1.5
font.lineHeight.1_55   : 1.55
font.lineHeight.1_7    : 1.7
font.lineHeight.2      : 2
font.lineHeight.normal : normal

font.tracking.-4   : -4px
font.tracking.-2_5 : -2.5px
font.tracking.-2   : -2px
font.tracking.-1_5 : -1.5px
font.tracking.-1   : -1px
font.tracking.-0_5 : -0.5px
font.tracking.0    : 0

font.ligatures.mono : none   # font-variant-ligatures
```

## Espaciado

El nombre es el valor en px.

```
space.0  : 0
space.2  : 2px
space.3  : 3px
space.4  : 4px
space.5  : 5px
space.6  : 6px
space.7  : 7px
space.8  : 8px
space.10 : 10px
space.12 : 12px
space.14 : 14px
space.16 : 16px
space.18 : 18px
space.20 : 20px
space.22 : 22px
space.24 : 24px
space.26 : 26px
space.28 : 28px
space.32 : 32px
space.40 : 40px
space.48 : 48px
space.56 : 56px
space.64 : 64px
space.72 : 72px
```

## Tamaños

```
size.11   : 11px    # punto de ventana terminal
size.12   : 12px    # nodo de Timeline, cuadro de leyenda del heatmap
size.14   : 14px    # celda del heatmap de Stats, nodo de miniatura Timeline
size.16   : 16px    # ícono chico
size.18   : 18px    # ícono mediano
size.20   : 20px    # ícono grande
size.22   : 22px    # celda del heatmap de Home (alto)
size.28   : 28px    # número de paso
size.30   : 30px    # celda de la miniatura de Devdle
size.36   : 36px    # segmento ES/EN (alto), muestra de leyenda Devdle, segmento de progreso (ancho)
size.40   : 40px    # control chico, círculo de banner, segmento ES/EN (ancho mínimo)
size.44   : 44px    # control mediano / área táctil
size.48   : 48px    # control grande, celda de Grep
size.52   : 52px    # fila de Timeline
size.54   : 54px    # tecla de Devdle
size.56   : 56px    # opción de Big O
size.64   : 64px    # celda de Devdle
size.150  : 150px   # miniatura de tarjeta de juego
size.300  : 300px   # alto mínimo de tarjeta placeholder
size.540  : 540px   # ancho máximo del lede
size.620  : 620px   # ancho máximo del teclado
size.1240 : 1240px  # ancho máximo de página
```

## Radios

```
radius.3    : 3px
radius.4    : 4px
radius.5    : 5px
radius.6    : 6px
radius.7    : 7px
radius.8    : 8px
radius.10   : 10px
radius.12   : 12px
radius.14   : 14px
radius.16   : 16px
radius.full : 999px
```

## Bordes

```
border.width.1 : 1px
border.width.2 : 2px
border.width.3 : 3px   # barra lateral (como box-shadow inset)
border.width.4 : 4px   # barra superior de tarjeta por juego (Stats)
border.style.solid  : solid
border.style.dashed : dashed
```

## Sombras

```
shadow.drop.window   : 0 24px 60px color.black-a45
shadow.ring.1        : 0 0 0 1px <color>
shadow.glow.featured : 0 18px 40px <color>
shadow.inset.bar     : inset 3px 0 0 <color>
```

## Motion

```
motion.duration.blink : 1.1s
motion.timing.steps1  : steps(1)
motion.keyframes.blink: 0%,49% { opacity: 1 } 50%,100% { opacity: 0 }
motion.scroll.smooth  : smooth
```

## Textura

```
texture.dots.color : color.neutral.770
texture.dots.size  : 24px
texture.dots.dot   : 1px   # radial-gradient(<color> 1px, transparent 1px)
```

## Reglas

- **No consumir desde componentes directamente.** Siempre vía semánticos.
- **No agregar valores que no estén en el prototipo** sin pasar por `/product-design-system-update`.
- **Cambiar un valor existente = MAJOR.**

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-03 v0.1.1 — Paleta de color oscura del prototipo en lugar de la clara de relleno.
- 2026-11-05 v0.2.0 — Se agrega `radius.xl` (16px), usado por Card.
- 2026-11-05 v1.0.0 — Inventario completo del prototipo: 24 neutros, escalas por matiz (verde, ámbar, azul, violeta, rosa, rojo) con tonos `dim` y alfas, escala tipográfica real (22 tamaños, pesos 400/500/700/800, interlineados, tracking), espaciado nombrado por px (2-72), tamaños, radios 3-16 + full, sombras, motion y textura. `color.green.950` pasa a `color.green.975`; `space.N` cambia de índice 4pt a valor en px; `radius.none/sm/md/lg/xl` pasan a `radius.N`.
