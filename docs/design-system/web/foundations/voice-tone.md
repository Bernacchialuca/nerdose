---
foundation: voice-tone
version: 1.0.0
last_updated: 2026-11-05
status: defined
source: docs/nerdose.html
---

# Voz y tono

## Propósito

Define cómo habla `web`. La voz del prototipo `docs/nerdose.html` es la de una **terminal amable**: interfaz escrita como comandos, comentarios y rutas; prosa cercana en español rioplatense con voseo. La consumen quienes escriben microcopy (ES y EN) y quienes arman pantallas.

## Atributos

| Atributo | Qué significa | Ejemplo del prototipo |
|---|---|---|
| Terminal | La interfaz se escribe como shell: prompts, rutas, comentarios, códigos de salida | `$ nerdose --today`, `./juegos`, `// racha global`, `exit 0` |
| Cercana | Voseo rioplatense, segunda persona, sin formalidad | "Adiviná el término del día", "Leé qué debería hacer la función" |
| Breve | Frases cortas; los datos se separan con `·` | "6 intentos · ~2 min · ▲ racha 12" |
| Sin drama | Perder no se castiga; se explica | "Desafío completado: tus rachas siguen en pie" |
| Didáctica | Al terminar, se enseña algo concreto | "Mirá siempre cómo avanza cada variable." |

## Recursos de terminal

| Recurso | Forma | Uso | Ejemplos (fuente) |
|---|---|---|---|
| Logo | `> nerdose_` (cursor en Home), `> nerdose` en juegos | Marca | L19, L437 |
| Prompt `$` | `$ comando --flag` en Mono gris, sobre el título | Eyebrow de página | `$ nerdose --today // viernes 30 oct` (L38), `$ nerdose stats --local` (L303), `$ grep -o '[A-Z]*' hoy.txt` (L1104), `$ git checkout -b próximo-juego` (L193) |
| Rutas | `./sección` | Navegación | `./juegos`, `./stats`, `./about` (L21-23) |
| Comentario `//` | `// minúsculas` | Título de cada panel y estado de partida | `// cómo leer las pistas`, `// el fix · línea 4`, `// término técnico · 6 letras · intento 4 de 6` (L455) |
| Slug kebab-case | nombre del juego | Breadcrumb, terminal, tabla | `bug-hunt`, `tech-timeline`, `grep-grid` |
| Archivo / ventana | `~/ruta — archivo.log` | Título de ventana | `~/hoy — progreso.log` (L52) |
| Hint `>` | `> instrucción` | Estado de juego en línea | `> tocá la primera letra de una palabra` (L1221) |
| Código de salida | `exit 0` | Cierre del footer | L256 |

Los títulos de pantalla (`h1`) **no** llevan `//`: son frases normales ("Tus estadísticas", "¿En qué línea está el bug?"). El `//` va en etiquetas de panel y eyebrows.

## Convenciones de texto

- **Separador:** `·` entre metadatos ("desafío del 30/10 · loops anidados").
- **Avance:** `→` al final de todo CTA de avance ("Jugar →", "Siguiente juego →", "ver estadísticas →").
- **Vacío:** `—` (tabla, terminal).
- **Minúsculas** en etiquetas, chips, badges, nav y comentarios; frase normal en títulos y botones grandes.
- **Números:** coma decimal y punto de miles en ES (`2,8`, `10.240`); tiempos `mm:ss`; fechas `vie 30/10`.
- **Racha:** siempre con la palabra "racha" o la llama: "▲ racha 12", "racha 5 · máx 11", "17 días".

## Voseo (ES)

Verbos en imperativo y presente con voseo: Adiviná, Ordená, Encontrá, Tocá, Leé, Confirmá, Elegí, Mirá, Tenés, Compartís, Aprendés, Copiás. Ejemplos reales:

- "Tocá la primera y la última letra de cada palabra. Están en horizontal, vertical o diagonal." (L1106)
- "Confirmá. Tenés **un solo intento**." (L691)
- "Dos minutos, algo aprendido, una racha que cuidar." (L40)
- "Cada palabra que encontrás revela qué hace. Tu tiempo final es tu puntaje: compartís el reloj, no las palabras." (L1146)

EN mantiene la misma voz, con textos naturales en inglés (no traducción literal): "A daily dose of nerdiness.", "Keep playing →" (diccionario L1226-1512).

## Tono por situación

| Situación | Tono | Ejemplo |
|---|---|---|
| Ganaste | Directo, con el dato | "Bug encontrado en la línea 4" · "Racha de Bug Hunt: 6 días · racha global: 17 días" |
| Perdiste | Sin culpa, la racha sigue | "El bug estaba en la línea 4, no en la 7" · "Desafío completado: tus rachas siguen en pie" |
| Error de jugada | Silencioso, en el hint | "> no es una palabra de la lista, probá de nuevo" |
| Pendiente / deshabilitado | Dice cuándo estará disponible | "Disponible al terminar la partida" (title de Compartir) |
| Próximamente | Prompt git | "$ git checkout -b próximo-juego" · "Más desafíos en camino." |
| Error del sistema *(adaptación)* | Qué pasó + qué hacer | "No pudimos cargar los juegos de hoy." + "Reintentar" |

## Tokens

No aplica (foundation de contenido). Los componentes declaran su microcopy en "Guidelines de contenido".

## Guidelines

**Do:**
- Usar `//` para nombrar paneles y `$` para eyebrows de página.
- Terminar los CTA de avance con `→`.
- Explicar la respuesta al final de cada juego.

**Don't:**
- No usar "usted" ni tuteo neutro en ES.
- No poner jerga de terminal en mensajes de error del sistema que el jugador tenga que entender para seguir (el qué-hacer va en lenguaje llano).
- No usar mayúsculas para enfatizar ni signos de exclamación múltiples.

## Accesibilidad

- Los prompts y comentarios son texto visible; los lectores de pantalla leen "barra barra": en etiquetas que funcionan como encabezado, el nombre accesible del panel puede omitir el `//` (usar `aria-labelledby` a un texto sin prefijo o marcar el prefijo `aria-hidden`).
- `→` decorativo va `aria-hidden`.
- Nada se comunica solo con un glifo: `✓`/`✗` van con palabra o con `aria-label`.

## Historial

- 2026-11-03 v0.1.0 — Placeholder inicial.
- 2026-11-05 v1.0.0 — Voz de terminal del prototipo (prompts `$`, rutas `./`, comentarios `//`, `exit 0`), convenciones de texto, voseo rioplatense con ejemplos reales y tono por situación.
