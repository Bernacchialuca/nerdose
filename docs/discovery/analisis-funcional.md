---
created: 2026-11-03
last_updated: 2026-11-03
status: "Análisis funcional cerrado"
documento_base: "docs/brief.md (complementado con docs/ARCHITECTURE.md y el prototipo docs/nerdose.html)"
---

# Análisis Funcional — nerdose

## Contexto y Alcance

### Producto

**nerdose** es una plataforma web de minijuegos diarios para developers, programadores y entusiastas de la tecnología. Cada juego tiene su propia mecánica (vocabulario, lectura de código, complejidad algorítmica, historia tech, sopa de letras) y un único desafío por día, igual para todos los jugadores. Los jugadores son anónimos (sin login), mantienen rachas por juego y una global, consultan sus estadísticas y comparten sus resultados sin spoilers. Todo el contenido se genera, se verifica y se publica automáticamente, en español e inglés.

**Propuesta de valor:** una pequeña dosis diaria de nerdiness.

### Objetivo Estratégico

**Proyecto personal, hecho por gusto.** No persigue un objetivo de negocio ni metas de crecimiento: si otros jugadores lo adoptan, es un plus, no el fin. No hay monetización. Las métricas sirven solo para saber si el producto se usa y si los desafíos funcionan bien, no como objetivos a cumplir.

### Principios Rectores

- **Rápido**: cada partida dura entre 1 y 3 minutos.
- **Adictivo**: desafío diario, rachas y estadísticas para volver todos los días.
- **Educativo**: cada juego termina con una explicación o algo de contexto.
- **Social**: el resultado se comparte en un toque, sin spoilers, y se entiende fuera de la plataforma.
- **Variado**: no todos los juegos requieren saber programar.
- **Accesible**: cualquier persona interesada en tecnología puede jugar (mobile-first, WCAG AA).
- **Consistente**: todos los jugadores juegan el mismo desafío por juego y día UTC.
- **Automático**: nadie carga, revisa ni publica contenido a mano. Lo único manual es programar los generadores una vez.
- **El servidor es dueño de la verdad**: el cliente nunca puede obtener la solución antes de terminar la partida.
- **Identidad propia por juego**: cada juego tiene sus propios intentos, puntaje, interacción y formato. Lo que unifica la plataforma es la experiencia, la identidad visual y el sistema de progreso.

### Alcance v1

| Dentro del alcance v1 | Fuera del alcance v1 |
|---|---|
| 5 juegos completos: Devdle, Bug Hunt, Big O Challenge, Tech Timeline, Grep Grid | Más juegos (ej. Async Arena), aunque la plataforma debe permitir sumarlos |
| Desafío diario por juego, que cambia a las 00:00 UTC | Archivo o replay de desafíos pasados |
| Jugadores anónimos identificados por cookie | Registro, login y cuentas de jugador (se prevé la migración a futuro) |
| Rachas por juego y racha global | Rankings y competencia entre jugadores |
| Estadísticas por jugador, propias de cada juego, más historial | Ejemplo de uso en Devdle |
| Share sin spoilers en cada juego | Generación o validación de contenido con LLM |
| Bilingüe ES/EN (interfaz y contenido) | Más idiomas |
| Reporte de problemas por desafío | Despublicación automática por reportes |
| Generación y verificación automática del contenido, por reglas | Dificultad planificada o niveles de dificultad |
| Admin aparte (reportes y anulación, próximos desafíos, stock de contenido) | Admin multiusuario o con roles |
| Analítica básica (Plausible) | Monetización (ads, premium, sponsors) |
| Página principal como catálogo de juegos | Notificaciones push o recordatorios por mail |

### Restricciones

**Permitido:** datos abiertos de Wikidata y Wikipedia (licencias CC0 y CC BY-SA, con atribución), diccionarios de inglés de licencia libre (ENABLE, SCOWL), nombres de tecnologías y empresas como referencia factual.
**Prohibido:** exponer al cliente cualquier dato que revele la solución antes de terminar (respuesta, posiciones, línea del bug, orden correcto, lista de respuestas posibles de Devdle por separado). Predecir desafíos futuros a partir del código público.
**Estrategia:** la validación ocurre 100% en el servidor y la solución se revela solo al cerrar la partida. Los desafíos se generan con un seed que depende de un secreto que no está en el repo. Se atribuyen las fuentes de Wikipedia y Wikidata en la sección "Acerca de".

## Mapa Funcional

> **Borrador.** `/product-initialize` lo formaliza en feature groups reales; FG-1 es el walking skeleton.

```
nerdose
├── [FG-1] Plataforma base: sesión anónima, día UTC, shell, catálogo (home), i18n ES/EN
├── [FG-2] Devdle + rachas + estadísticas + share (valida el contrato común de juegos)
├── [FG-3] Grep Grid
├── [FG-4] Tech Timeline
├── [FG-5] Reportes de problemas + Admin (reportes, anulación, próximos desafíos, stock)
├── [FG-6] Big O Challenge (generación de código multi-lenguaje verificada)
├── [FG-7] Bug Hunt (mutation testing multi-lenguaje)
├── [FG-8] Estadísticas completas (heatmap, historial) + pulido mobile
└── Transversales
    ├── Generación automática de contenido (bancos, generadores, verificación, publicación)
    ├── Anti-spoiler / seguridad
    ├── Rate limiting
    ├── i18n (ES + EN)
    ├── Accesibilidad (mobile-first, WCAG AA)
    ├── Privacidad (cookie funcional, sin banner)
    ├── Identidad visual
    └── Analítica (Plausible)
```

## Reglas comunes a todos los juegos

Aplican a todos los juegos. Cada feature group detalla solo lo propio.

- **Día de la plataforma:** el día es UTC. Los desafíos cambian a las 00:00 UTC (21:00 en Argentina). El servidor calcula "hoy"; el cliente nunca manda la fecha.
- **Número de desafío:** es el número de día de la plataforma (#1 = día de lanzamiento) y es el mismo para los 5 juegos ese día.
- **Una partida por jugador, juego y día.** Una partida terminada no acepta más jugadas.
- **Pantallas por juego:** instrucciones, partida y resultado.
- **Retomar:** si el jugador sale y vuelve el mismo día, retoma la partida en el estado en que la dejó.
- **Partida terminada = completada**, gane o pierda. Una partida a medias no cuenta.
- **Cambio de día con la partida a medias:** si una jugada llega después de las 00:00 UTC para el desafío del día anterior, se rechaza (`challenge_expired`) y el front carga el desafío nuevo. La partida vieja queda sin terminar: no cuenta como completada ni como derrota.
- **Resultado:** al terminar se revela la solución con su explicación, el resultado del jugador, el botón de compartir y las rachas actualizadas.
- **Share:** se comparte copiando al portapapeles o con el share nativo del dispositivo. El formato es emoji del juego + nombre + `#número`, una línea de resultado sin spoilers y `nerdose.dev`.
- **Reportar un problema:** está disponible durante la partida y en el resultado (ver FG-5).
- **Sin desafío hoy:** si un juego no tiene desafío publicado, se muestra "sin desafío hoy" y ese día es neutro para la racha de ese juego.

## FG-1 — Plataforma base y catálogo

### Objetivo

Entrar a la plataforma sin registrarse, ver todos los juegos con el estado del día y la racha global, y navegar entre juegos en ES o EN.

### Configuraciones

| Configuración | Default | Alternativas |
|---|---|---|
| Idioma | El del navegador (`Accept-Language`); si no es ES ni EN, `es` | `en` / `es`, desde un selector visible |
| Lenguaje de código preferido (Bug Hunt / Big O) | JavaScript | Go, Java |

### Flujo

1. El jugador entra por primera vez y se le crea un jugador anónimo, guardado en una cookie funcional httpOnly.
2. La home muestra la identidad, una presentación breve, los 5 juegos con su descripción, el estado del día de cada uno (sin jugar / en curso / completado / sin desafío / anulado), el acceso para jugar, la racha global, un resumen de progreso y una cuenta regresiva hasta el próximo desafío.
3. El jugador elige un juego y pasa a las instrucciones, la partida y el resultado.
4. Vuelve a la home o pasa directo a otro juego.

### Reglas

- El idioma elegido se guarda como preferencia del jugador y se puede cambiar en cualquier momento, incluso a mitad de partida, sin afectar el juego.
- La home debe sentirse como un producto de entretenimiento, no como un dashboard administrativo.
- Cada juego se presenta como una experiencia independiente dentro del mismo universo.

### Edge cases / Condiciones de falla

| Causa | Resultado |
|---|---|
| El jugador borra la cookie | Se crea un jugador nuevo: pierde el historial y las rachas (límite conocido, no hay cuentas) |
| Cookies bloqueadas | Se puede ver el catálogo, pero no jugar: se muestra un aviso |
| Cambio de día con la home abierta | La cuenta regresiva llega a 0 y la home recarga el estado del día |

## FG-2 — Devdle

### Objetivo

Adivinar el término técnico del día en hasta 6 intentos, con feedback por letra.

### Configuraciones

| Configuración | Default | Alternativas |
|---|---|---|
| Intentos | 6 | — |
| Longitud de la palabra | La de la respuesta (4 a 12 letras A–Z) | — |

### Flujo

1. Se muestra la longitud de la palabra y la lista de categorías posibles (no la del día).
2. El jugador escribe un intento de la longitud correcta (mayúsculas o minúsculas indistintamente).
3. El servidor valida que la palabra esté en la lista de palabras válidas. Si no está, avisa "no está en la lista" y **no consume intento**.
4. Si es válida, responde verde, amarillo o gris por letra, con el manejo estándar de letras repetidas.
5. La partida termina al adivinar (victoria) o al agotar los 6 intentos (derrota).
6. Resultado: la palabra, su categoría, una definición breve y un resumen del concepto.

### Reglas

- **Lista de palabras válidas** = términos del banco + diccionario de inglés de licencia libre (A–Z, 4–12 letras) + nombres en inglés de conceptos de computación de Wikidata.
- **La lista crece sola:** si 5 jugadores distintos intentan una palabra rechazada que existe como nombre de un ítem de Wikidata o como entrada de Wiktionary, se agrega automáticamente.
- Las respuestas posibles nunca se envían al cliente por separado.
- La respuesta es un término del banco que no se usó en los últimos 365 días, rotando la categoría respecto de los últimos 3 días.
- Categorías (según lo que provea el banco): lenguajes de programación, Git, bases de datos, networking, Linux, APIs, seguridad, software engineering.
- Sin modo difícil.
- **Share:** grilla de emojis 🟩🟨⬛ por intento y `N/6` (o `X/6` si perdió).
- **Stats propias:** distribución de intentos.

### Edge cases / Condiciones de falla

| Causa | Resultado |
|---|---|
| Palabra de otra longitud | No se envía; el front avisa |
| Palabra fuera de la lista | `not_in_word_list`, no consume intento y se registra el rechazo |
| Caracteres no A–Z | Se ignoran en el input |

## FG-3 — Grep Grid

### Objetivo

Encontrar 8 términos técnicos escondidos en una sopa de letras de 12×12, sin presión de tiempo.

### Configuraciones

| Configuración | Default | Alternativas |
|---|---|---|
| Tamaño de la grilla | 12×12 | — |
| Palabras | 8 | — |
| Direcciones | Horizontal, vertical y diagonal, solo hacia adelante | — |
| Límite de tiempo | **Sin tiempo** | — |

### Flujo

1. Se muestra la grilla y la lista de las 8 palabras (es pública).
2. El jugador toca la primera y la última letra de una palabra.
3. El servidor valida la selección. Si es correcta, la palabra se tacha, se marca en la grilla y se revela su definición breve.
4. La partida termina con victoria al encontrar las 8, o cuando el jugador toca **"Rendirse"**: derrota con N/8 y se revelan las faltantes.

### Reglas

- **Puntaje = palabras encontradas (0–8).** Es victoria solo con 8/8.
- Rendirse cuenta como partida completada para la racha.
- Las 8 palabras se eligen al azar del banco de términos (compartido con Devdle), sin tema común, con longitud ≤ 12 y sin repetir las usadas en Grep Grid en los últimos 30 días.
- Cada palabra aparece **exactamente una vez** en la grilla, en las direcciones permitidas. La generación lo verifica.
- Las posiciones son la solución: nunca se envían al cliente.
- **Share:** palabras encontradas `N/8`, sin revelar las palabras.
- **Stats propias:** promedio de palabras encontradas y porcentaje de partidas completas (8/8).

### Edge cases / Condiciones de falla

| Causa | Resultado |
|---|---|
| Selección que no es una palabra de la lista | Feedback "no es una palabra", sin penalización |
| Selección de una palabra ya encontrada | Se ignora |
| Selección fuera de las direcciones permitidas (por ejemplo, en reversa) | No se acepta |

## FG-4 — Tech Timeline

### Objetivo

Ordenar cronológicamente 5 hitos de la historia tech.

### Configuraciones

| Configuración | Default | Alternativas |
|---|---|---|
| Elementos | 5 | — |
| Orden pedido | Siempre del más antiguo al más reciente | — |
| Interacción | Arrastrar y soltar (touch y teclado) | — |

### Flujo

1. Se muestran la consigna, la categoría y 5 elementos desordenados, sin fecha.
2. El jugador los ordena arrastrando y soltando.
3. Confirma (**un solo intento**).
4. Resultado: el orden correcto con la fecha y una nota breve de cada elemento, y las posiciones acertadas.

### Reglas

- **Puntaje = posiciones correctas (0–5).** Es victoria solo con 5/5.
- Los 5 hechos son de una misma categoría y deben distinguirse sin ambigüedad: al menos 1 año de diferencia entre sí, o una fecha con precisión de mes o día que los separe.
- No se repiten hechos usados en los últimos 90 días.
- Los IDs de los elementos son opacos y aleatorios por desafío, para que no filtren el orden.
- **Categorías v1:** las que el banco automático de Wikidata llene con calidad (lenguajes, frameworks/librerías, empresas, sistemas operativos, hardware, videojuegos). "Hitos de Internet" e "historia general" quedan diferidas si no hay datos fiables.
- **Share:** 5 cuadrados 🟩/🟥, uno por posición, y `N/5`.
- **Stats propias:** promedio de posiciones correctas, por categoría.

### Edge cases / Condiciones de falla

| Causa | Resultado |
|---|---|
| Envío con elementos faltantes o duplicados | `invalid_move` |
| Hecho con fecha discutida (varias fechas en Wikidata) | No entra al banco |

## FG-5 — Reportes y Admin

### Objetivo

Que los jugadores puedan avisar que un desafío está mal, y que el responsable pueda revisarlo y anularlo. Es la red de seguridad de la publicación automática.

### Configuraciones

| Configuración | Default | Alternativas |
|---|---|---|
| Umbral de alerta | 3 reportes de `wrong_answer` o `ambiguous` de jugadores distintos, o más del 5% de las partidas terminadas | Configurable |
| Canal de alerta | Webhook (Discord, Slack o mail) | Configurable |
| Largo máximo del comentario | 1000 caracteres | — |

### Flujo (jugador)

1. Toca "Reportar un problema" durante la partida o en el resultado.
2. Elige un motivo: la respuesta es incorrecta · la consigna es ambigua · la explicación está mal · error de traducción · algo se ve mal · otro.
3. Agrega un comentario opcional y ve el aviso "No incluyas la respuesta si todavía estás jugando".
4. Envía. Se guarda con contexto: idioma, lenguaje de código elegido y estado de la partida.

### Flujo (admin)

1. Entra a `admin.nerdose.dev` con una única contraseña y obtiene una sesión de 8 horas.
2. **Reportes:** ve los reportes agrupados por desafío y ordenados por cantidad, con el desafío completo y su solución. Puede marcarlos como resueltos o descartados, o **anular el desafío**.
3. **Próximos desafíos:** ve una preview de los próximos 14 días por juego, con su log de verificación. Puede regenerar uno.
4. **Stock de contenido:** ve el contenido sin usar por banco y los rechazos de la última reposición (solo lectura).

### Reglas

- Un reporte por jugador y desafío, con rate limit.
- **Nunca se despublica automáticamente.** Anular un desafío siempre es una acción manual.
- **Al anular un desafío:**
  - deja de aceptar jugadas y muestra el aviso "Este desafío tenía un error y fue anulado. Tu racha no se ve afectada";
  - quien no había jugado puede marcarlo como completado y mantiene la racha;
  - las partidas que estaban en curso se cierran como completadas (anuladas);
  - todas las partidas de ese desafío cuentan para la racha, pero no como victoria ni como derrota: se excluyen del porcentaje de victorias y de las stats propias del juego;
  - se registra la causa. Si el error vino de un ítem de un banco, ese ítem pasa a `rejected`.
- Cada reporte confirmado debe convertirse en un test de regresión o en una regla nueva de verificación (proceso de desarrollo).

### Edge cases / Condiciones de falla

| Causa | Resultado |
|---|---|
| Segundo reporte del mismo jugador | Se rechaza (ya reportó) |
| Reportes masivos coordinados | Solo generan una alerta: no anulan nada |
| Token de admin vencido o inválido | 401, vuelve al login |

## FG-6 — Big O Challenge

### Objetivo

Identificar la complejidad temporal en el peor caso de un fragmento de código.

### Configuraciones

| Configuración | Default | Alternativas |
|---|---|---|
| Lenguaje | Preferencia del jugador (JS por defecto) | Go, Java |
| Opciones | Siempre las mismas 8: O(1), O(log n), O(n), O(n log n), O(n²), O(n³), O(2ⁿ), O(n!) | — |
| Intentos | 1 | — |

### Flujo

1. Se muestra el fragmento en el lenguaje elegido. El jugador puede cambiar de lenguaje libremente: es solo una vista.
2. Selecciona una opción y confirma.
3. Resultado: la respuesta correcta y la explicación paso a paso (costo de cada bloque, reglas de anidamiento y secuencia, simplificación final).

### Reglas

- Siempre se evalúa la complejidad temporal en el **peor caso**.
- No se usan construcciones cuyo costo dependa de los datos o de un promedio (por ejemplo, operaciones de hash map).
- La recursión doble se responde como O(2ⁿ), y la explicación aclara que la cota exacta es φⁿ.
- Se incluyen trampas con cierta frecuencia: loops en secuencia, loops hasta una constante y loops internos que duplican su variable.
- El código entra en pantalla: hasta unas 15 líneas y 3 niveles de anidamiento.
- **Variedad:** no se repite la misma receta en los últimos 30 días, y la misma respuesta no sale más de 2 días seguidos.
- **Verificación:** la respuesta calculada se confirma ejecutando el código con varios tamaños de entrada. Si no coincide, o si es ambigua, se descarta.
- Se registra el lenguaje con el que confirmó y se guarda como preferencia.
- **Share:** 🟩/🟥 y el lenguaje, sin revelar la opción.
- **Stats propias:** aciertos por categoría (loops, recursión, búsquedas…).

## FG-7 — Bug Hunt

### Objetivo

Encontrar la línea con el bug en una función corta que no cumple su especificación.

### Configuraciones

| Configuración | Default | Alternativas |
|---|---|---|
| Lenguaje | Preferencia del jugador (JS por defecto) | Go, Java (el bug es el mismo en los tres) |
| Intentos | 1 | — |
| Largo de la función | 8 a 15 líneas | — |

### Flujo

1. Se muestran la especificación (1–2 líneas), la función, algunos tests que pasan y el aviso de que hay un test oculto que falla.
2. El jugador puede cambiar de lenguaje libremente.
3. Toca una línea elegible y confirma.
4. Resultado: la línea correcta, el test que falla (esperado vs. obtenido), el fix como diff y una explicación paso a paso.

### Reglas

- No se pueden elegir la firma de la función ni las líneas que solo tienen llaves.
- Una sentencia cae en la misma línea en los tres lenguajes.
- Los desafíos se generan con mutation testing: una plantilla de función correcta, con parámetros al azar, recibe una única mutación.
- La mutación se acepta solo si hace fallar al menos un test con el mismo resultado en los tres lenguajes, y si al menos 2 tests siguen pasando (son los visibles). Los mutantes equivalentes se descartan.
- Como test oculto se elige el más chico que falla. Si el bug está en un caso borde, los tests visibles no lo cubren.
- Tipos de bug: off-by-one, comparaciones, operador equivocado, variable o índice equivocado, inicialización incorrecta, `return` mal ubicado o condición invertida.
- **Variedad:** no se repite la misma combinación de plantilla, parámetros y mutación en los últimos 60 días.
- **Share:** `🐛 Bug Hunt #N · <lenguaje>` y `🟩 bug encontrado` / `🟥 se me escapó`, sin revelar la línea.
- **Stats propias:** aciertos por lenguaje y por tipo de bug.

## FG-8 — Estadísticas completas

### Objetivo

Consultar el progreso propio de forma completa.

### Flujo

1. El jugador abre la pantalla de stats.
2. Ve la racha global actual y su récord, las rachas actuales y récords por juego, los desafíos completados, el porcentaje de victorias o la precisión por juego, las stats propias de cada juego, un heatmap de actividad diaria y el historial de resultados (con etiqueta corta por partida: "✓ 4/6", "✗ L7", "6/8"…).

### Reglas de rachas

- **Racha por juego:** días UTC consecutivos con ese juego completado (ganado o perdido).
- **Racha global:** días UTC consecutivos con al menos un juego completado.
- **Día neutro:** un día sin desafío publicado no suma ni corta la racha de ese juego. Para la racha global, el día es neutro solo si ningún juego tuvo desafío.
- La racha se muestra viva si el último día completado es hoy o ayer; si no, se muestra 0.
- Los desafíos anulados cuentan para las rachas, pero no para el porcentaje de victorias ni para las stats propias.
- El historial es la fuente de verdad: los agregados se pueden recalcular a partir de él.

## Transversales

### Generación automática de contenido

| Pieza | Definición |
|---|---|
| Anticipación | Siempre hay desafíos aprobados para los próximos 14 días por juego (cron diario) |
| Publicación | Automática: todo lo que pasa la verificación se publica en su fecha, sin revisión humana |
| Reintentos | Si un desafío falla la verificación, se genera otro con un seed derivado |
| Alerta | Si tras N reintentos un juego no tiene el desafío de mañana, se notifica por webhook |
| Bancos | `terms` y `timeline_facts` se reponen solos desde Wikidata y Wikipedia (semanal) cuando queda stock para menos de un año. Ítems sin los dos idiomas o sin las reglas de calidad pasan a `rejected` |
| Inmutabilidad | Se guarda el desafío generado, no solo el seed: cambiar el generador no altera desafíos ya generados |
| Imprevisibilidad | El seed depende de un secreto fuera del repo |
| Sin LLM | Todo por reglas y ejecución en el MVP |

### Anti-spoiler / seguridad

| Pieza | Definición |
|---|---|
| Solución | Nunca sale del servidor antes de terminar la partida |
| Validación | 100% server-side; la API nunca ejecuta código (solo el generador, offline) |
| IDs públicos | No revelan información (Timeline con IDs opacos; Grep Grid sin posiciones) |
| Límite aceptado | Un jugador puede borrar la cookie, perder adrede y ver la respuesta. Se acepta porque no hay rankings |

### Rate limiting

| Acción | Límite |
|---|---|
| Jugadas (`move`) | Por jugador e IP; valores concretos a definir en la fase técnica, para ~1.000 jugadores diarios |
| Crear sesión | Por IP |
| Reportes | 1 por jugador y desafío, más un límite por IP |

**Comportamiento:** HTTP 429 con mensaje genérico. Sin captcha.

### Escala

~1.000 jugadores diarios el primer año, con pico a las 00:00 UTC. Alcanza con una instancia de API y un PostgreSQL.

### Accesibilidad

| Pieza | Definición |
|---|---|
| Dispositivos | Mobile-first; también desktop |
| Nivel | WCAG 2.1 AA (contraste, foco visible, labels) |
| Teclado | Todos los juegos se pueden jugar con teclado, incluido el drag & drop de Timeline |
| Color | El feedback no depende solo del color (Devdle, Timeline): suma ícono o patrón |

### Privacidad

| Pieza | Definición |
|---|---|
| Cookie | Una cookie funcional httpOnly con el ID de jugador. Sin PII. **Sin banner de cookies** |
| Analítica | Plausible (sin cookies) |
| Retención | Indefinida para jugadores anónimos (historial y rachas) |
| Aviso | Aviso breve de privacidad en el footer |

### Identidad visual

Estética terminal/dev, oscura, con tipografía monoespaciada (JetBrains Mono) y acento verde `#3DDC84`, según el prototipo `docs/nerdose.html`. Cada juego puede tener su color de acento propio dentro del sistema común.

## Internacionalización (i18n)

**Idiomas v1:** Español + Inglés, desde el lanzamiento.
**Reglas:**
- Todo lo que lee el jugador (interfaz, consignas, definiciones, explicaciones, notas) existe en los dos idiomas.
- No son traducciones literales: cada idioma debe sonar natural, y lo obligatorio es que signifiquen lo mismo.
- La solución de cada desafío es la misma en los dos idiomas (las palabras de Devdle y Grep Grid son términos en inglés).
- Un contenido al que le falta un idioma no se publica.
- El código de Bug Hunt y Big O no se traduce.

## Métricas

### Uso
- Jugadores únicos diarios (DAU), total y por juego.

### Retención
- Distribución de rachas globales y retorno D1 y D7.

### Calidad de los desafíos
- Tasa de completado (inicio → fin) y porcentaje de victorias por juego y por desafío, para detectar desafíos rotos o demasiado difíciles.
- Reportes por desafío y desafíos anulados.

### Social
- Clicks en compartir, por juego.

## Dependencias y Bloqueos Abiertos

### Wikidata / Wikipedia
Son la fuente de los bancos `terms` y `timeline_facts`. Hay que validar la cobertura real por categoría (sobre todo en Timeline) y la calidad de los textos en español. Requiere atribución CC BY-SA.

### Diccionario de inglés
ENABLE (dominio público) o SCOWL, para la lista de palabras válidas de Devdle.

### Toolchains del generador
Node, Go y JDK en el contenedor del generador, para compilar y ejecutar Big O y Bug Hunt.

### Dominio
`nerdose.dev` y `admin.nerdose.dev`.

## Fuera de Alcance — Preguntas Abiertas

- **Login y cuentas de jugador:** diferido. El modelo separa jugador de usuario para sumarlo sin migrar datos y fusionar historiales.
- **Rankings:** diferido. Si se suman, van atados a cuentas autenticadas.
- **Archivo de desafíos pasados:** fuera de alcance por diseño.
- **LLM para contenido:** post-MVP (variedad de código, ejemplos de uso, explicaciones, juez de calidad), siempre offline y verificado.
- **Categorías de Timeline "Hitos de Internet" e "Historia general":** diferidas hasta tener una fuente automática fiable.
- **Async Arena y otros juegos:** ideas futuras. La plataforma debe permitir sumarlos como módulos.
- **Valores concretos de rate limit:** se definen en el análisis técnico.

## Decisiones Tomadas

| # | Tema | Decisión y por qué |
|---|---|---|
| 1 | Objetivo estratégico | Proyecto personal hecho por gusto, sin objetivo de negocio ni monetización. Si gana usuarios, mejor, pero no es la meta. Por eso las métricas son de salud y calidad, no metas, y ninguna decisión de v1 se toma pensando en crecimiento o ingresos |
| 2 | Día de la plataforma | UTC, con cambio a las 00:00. Un único "hoy" para todos simplifica la consistencia y el cálculo de rachas |
| 3 | Completar vs. ganar | Perder también cuenta como completar. La racha mide constancia; el porcentaje de victorias ya mide aciertos |
| 4 | Partida a medias al cambiar el día | No cuenta (ni completada ni derrota) y la jugada tardía se rechaza. Es coherente con "completar = terminar" y no premia empezar sin terminar |
| 5 | Día sin desafío (falla del generador) | Día neutro para la racha del juego; para la global, solo si ningún juego tuvo desafío. No se castiga al jugador por un error de la plataforma |
| 6 | Grep Grid: tiempo | **Sin tiempo.** El puntaje son las palabras encontradas (0–8) y la victoria es 8/8. Lo hace más simple y relajado, y elimina la medición del reloj en el servidor |
| 7 | Grep Grid: abandono | Botón "Rendirse": cierra como derrota con N/8, cuenta para la racha y revela las faltantes. Da una salida clara y explica el N/8 del share |
| 8 | Tech Timeline: orden y victoria | Siempre ascendente (más antiguo primero); puntaje 0–5 y victoria solo con 5/5. Una consigna fija evita confusión, y 5/5 mantiene el porcentaje de victorias exigente |
| 9 | Tech Timeline: categorías v1 | Solo las que Wikidata cubre con calidad. El contenido debe ser automático y verificado; no se fuerza una categoría sin fuente fiable |
| 10 | Lenguaje en Bug Hunt / Big O | Cambio libre durante la partida y preferencia recordada. El lenguaje es solo una vista; la respuesta es la misma en los tres |
| 11 | Formato de share | Emoji del juego + nombre + #número + resultado sin spoilers + nerdose.dev. Devdle: grilla 🟩🟨⬛ + N/6; Big O: 🟩/🟥 + lenguaje; Timeline: 5 cuadrados + N/5; Bug Hunt: 🟩/🟥 + lenguaje; Grep Grid: N/8. Formato unificado y reconocible que no revela la solución |
| 12 | Número de desafío | Número de día de la plataforma, igual para los 5 juegos. Cada número corresponde a una fecha y se lee igual en todos los shares |
| 13 | Anulación con partidas en curso | Se cierran como completadas (anuladas): cuentan para la racha, no como victoria ni derrota. El error es de la plataforma |
| 14 | Anulación: decisión | Siempre manual desde el admin; los reportes solo alertan. Evita el abuso coordinado de reportes |
| 15 | Umbral de alerta de reportes | 3 reportes `wrong_answer`/`ambiguous` de jugadores distintos o más del 5% de las partidas terminadas, configurable. Detecta temprano sin generar ruido |
| 16 | Publicación | Automática si pasa la verificación, sin revisión humana. No hay una persona a cargo de los juegos; los reportes son la segunda línea de control |
| 17 | Contenido sin LLM | Reglas, datos abiertos y ejecución en el MVP. Las respuestas tienen que ser verificables, no depender de que un modelo "tenga razón" |
| 18 | Devdle: palabras válidas | Banco + diccionario de inglés + conceptos de Wikidata, y la lista crece con los rechazos repetidos. Evita adivinar con letras sin sentido sin rechazar términos reales; un intento rechazado no consume intento |
| 19 | Sin archivo | Solo se juega el desafío de hoy. Refuerza el hábito diario y simplifica el anti-spoiler |
| 20 | Autenticación | Jugadores anónimos con identidad en el servidor, separada de usuarios. Cero fricción hoy y migración sin pérdida de datos mañana |
| 21 | Admin | App aparte en un subdominio, con una sola contraseña y una sesión de 8 horas. Simple para un proyecto de una persona, pero protege las soluciones de los próximos días |
| 22 | Bilingüe | ES/EN desde el lanzamiento, con textos naturales en cada idioma y la misma solución. Lo pide el brief; un contenido sin los dos idiomas no se publica |
| 23 | Escala objetivo | ~1.000 jugadores diarios con pico a las 00:00 UTC. Alcanza con una instancia, sin escalado horizontal en v1 |
| 24 | Accesibilidad | Mobile-first + WCAG 2.1 AA + jugable con teclado. Es el principio "Accesible" del brief, y el uso diario ocurre sobre todo en el teléfono |
| 25 | Privacidad | Cookie funcional sin PII, sin banner, Plausible sin cookies y retención indefinida. No hay datos personales que justifiquen un banner o una purga |
| 26 | Interacciones de un solo intento | Seleccionar y después confirmar (Bug Hunt, Big O, Timeline). Evita perder la partida por un toque accidental |
| 27 | Idioma de la interfaz | Se toma del navegador, se puede cambiar con un selector visible y se guarda. Se puede cambiar a mitad de partida sin afectar el juego |
| 28 | Big O: criterio | Complejidad temporal en el peor caso, 8 opciones fijas y O(2ⁿ) por convención para la recursión doble. Garantiza una única respuesta indiscutible |
