---
document: UX Benchmark
audience: jugador
version: "1.0"
date: 2026-11-03
status: Hipótesis inicial - Referencias de partida
---

# Benchmark — jugador

> Referentes mentales que esta audiencia trae al producto. Productos que
> ya usa o conoce, y de los que importa expectativas. No es auditoría
> exhaustiva — es punto de partida para entender qué patrones ya conoce
> el usuario y qué espera encontrar.

> Todo lo que sigue es hipótesis a validar con jugadores reales. Los detalles de producto salen de documentación pública y páginas de ayuda consultadas por búsqueda web el 2026-11-03; no se usaron las cuentas ni las apps.

## Competidores Directos

### Wordle (NYT)

- **Qué resuelve:** Un desafío diario de palabras, igual para todos: adivinar una palabra de cinco letras en seis intentos.
- **Cómo lo resuelve:** Feedback por letra con tres estados (verde, amarillo, gris). Estadísticas con partidas jugadas, % de victorias, racha actual, racha máxima y distribución de intentos. Al terminar, el botón de compartir abre las opciones del dispositivo o copia el resultado al portapapeles. La racha cuenta victorias consecutivas, hay que resolver antes de la medianoche local, y terminar después la corta. Iniciar sesión con cuenta NYT es opcional y sincroniza progreso entre dispositivos. El archivo existe solo para suscriptores y no afecta las rachas.
- **A tomar:** Panel de estadísticas con racha actual, racha máxima y distribución como convención conocida. Compartir en un toque con copia al portapapeles como respaldo. Separar el archivo de la racha (nerdose no tiene archivo, decisión #19).
- **A evitar:** La racha depende de ganar y de la medianoche local: una derrota o un viaje de huso horario cortan la racha (nerdose ya difiere: completar incluye perder y el día es UTC; ver Diferenciadores). El progreso entre dispositivos depende de una cuenta (nerdose es anónimo en v1: gap a comunicar).
- **Fuente:** Centro de ayuda de NYT Games, página de Wordle: https://thenewyorktimeshelpcenter.helpjuice.com/24611727334932-Wordle (consultado 2026-11-03).

### NYT Connections

- **Qué resuelve:** Un desafío diario de lógica por categorías: ordenar 16 palabras en cuatro grupos de cuatro.
- **Cómo lo resuelve:** Cuatro errores permitidos; se gana con menos de 4 errores y los fallidos igual cuentan como completados. Estadísticas: completados, % de victorias, racha actual y máxima, partidas perfectas e histograma de errores. Compartir con botón de copiar. Gratis y sin login obligatorio; la racha cuenta victorias consecutivas y no se puede reparar una racha cortada.
- **A tomar:** Un histograma propio del juego (en nerdose, las "stats propias" de cada juego, C-18/C-22/C-25/C-29/C-32). Separar "completado" de "ganado" en las estadísticas, como ya hace nerdose (decisión #3). Jugar sin sign-in.
- **A evitar:** La racha se corta por no ganar, a diferencia de la regla de nerdose; no replicar esa regla.
- **Fuente:** Centro de ayuda de NYT Games, página de Connections: https://thenewyorktimeshelpcenter.helpjuice.com/28525912587924-Connections (consultado 2026-11-03).

### Dev Wordle

- **Qué resuelve:** Un Wordle de vocabulario de programación: adivinar un término técnico de 5 letras en seis intentos.
- **Cómo lo resuelve:** Modo diario con racha y modo aleatorio con pistas (ej. "Infra") y opción de revelar la primera letra. Muestra estadísticas con distribución de intentos. Compartir copiando un enlace o publicando en X con texto preestablecido. Se presenta como gratis y sin registro. Tiene un ranking de "Top solvers" (hoy, semana, histórico) que se puede ocultar.
- **A tomar:** Sin registro como promesa explícita. Compartir con texto predefinido.
- **A evitar:** Ranking público de resolutores: en nerdose los rankings están fuera de v1 y atados a cuentas (alcance). El modo aleatorio ilimitado diluye el desafío único diario.
- **Fuente:** https://www.kunalganglani.com/games/dev-wordle (consultado 2026-11-03).

### Codele

- **Qué resuelve:** Un problema de código diario, estilo LeetCode con ánimo lúdico ("Wordle para código").
- **Cómo lo resuelve:** Un problema nuevo cada mañana (8 AM según la página), el jugador escribe código propio, compara su rendimiento con el de la comunidad, hay pistas que no revelan la solución y soluciones comentadas de otros usuarios. Se anuncia lista de mail para no perder desafíos.
- **A tomar:** Pistas que guían sin revelar la solución; explicación posterior como valor de aprendizaje (G-02).
- **A evitar:** Exigir escribir código en cada partida deja afuera a jugadores que no programan y no entra en 1-3 minutos desde el teléfono (hipótesis por analogía, sin verificar la duración real). La publicación a una hora local fija (8 AM) en lugar de un reloj común a todos.
- **Fuente:** Product Hunt, publicación de Codele 2: https://www.producthunt.com/p/codele/codele-2 (consultado 2026-11-03).

## Referentes Indirectos

### LeetCode, desafío diario (categoría: práctica de programación)

- **Qué expectativa trae a este producto:** Que un desafío diario tenga racha visible, un corte común a todos y reconocimiento por constancia.
- **Cómo se manifiesta:** Un problema diario; resolverlo antes de medianoche UTC extiende la racha y suma LeetCoins. Hay un calendario para acceder a cada día y una insignia mensual; los "Time Travel Tickets" permiten recuperar un día perdido. Coincide con el día UTC de nerdose.
- **Fuente:** Publicaciones oficiales "Daily LeetCoding Challenge" en https://leetcode.com/discuss/post/655704/ (consultado 2026-11-03). Son posts antiguos; el detalle actual puede haber cambiado.

### Termo (categoría: juego diario de palabras localizado)

- **Qué expectativa trae a este producto:** Que un juego diario simple, gratuito y en el idioma propio no tenga ads, compras ni notificaciones, y que el desafío sea el mismo para todos.
- **Cómo se manifiesta:** Según Wikipedia, una palabra por día igual para todos, resultado compartido como grilla de colores, sin anuncios, compras dentro de la app ni notificaciones, y modo de alto contraste para daltonismo. Se jugó en navegador. Las críticas por vocabulario regional ("mamãe", "miojo") muestran que el contenido localizado necesita cuidado por variante de idioma.
- **Fuente:** https://en.wikipedia.org/wiki/Termo_(video_game) (consultado 2026-11-03).

## Patrones Recurrentes

- **Un desafío por día, igual para todos, con cambio a hora fija** — Wordle, Connections, Termo, Dev Wordle (modo diario), Codele, LeetCode. Es la convención del género; la variante es el reloj (medianoche local en NYT, UTC en LeetCode y nerdose).
- **Resultado compartible como texto en un toque, con copia al portapapeles como respaldo** — Wordle, Connections, Termo, Dev Wordle. Es la forma esperada de compartir sin revelar la respuesta.
- **Panel de estadísticas con partidas, % de victorias, racha actual y máxima, y un histograma** — Wordle y Connections (verificados); Dev Wordle muestra racha y distribución. Es lo que el jugador busca al terminar.
- **Jugar sin cuenta, con cuenta opcional solo para sincronizar** — Wordle y Connections (cuenta opcional), Dev Wordle (sin registro). Cuenta opcional resuelve el cambio de dispositivo; nerdose no la tiene en v1.
- **Partida corta, de una sola sesión** — todos los directos verificados. Codele es la excepción probable por exigir código propio (sin verificar).

## Diferenciadores

- **Cinco mecánicas distintas bajo una sola identidad** — Los directos verificados son un solo juego (Wordle, Connections, Dev Wordle) o un solo tipo de desafío (Codele). nerdose ofrece vocabulario, lectura de código, complejidad, historia y sopa de letras con un número de desafío común (`#8`).
- **Juegos para quien no programa y juegos para quien programa, en la misma plataforma** — Dev Wordle sirve a quien conoce el vocabulario; Codele exige programar. nerdose combina Devdle, Tech Timeline y Grep Grid (no requieren programar) con Bug Hunt y Big O (sí).
- **Completar cuenta aunque se pierda, y los días sin desafío no cortan la racha** — En Wordle y Connections la racha cuenta victorias consecutivas. La racha de nerdose mide constancia (decisión #3, #5). Hipótesis a validar: que esto sea percibido como más justo.
- **Explicación que enseña tras cada partida** — Los directos verificados no documentan una explicación de aprendizaje por partida (excepto Codele con soluciones de usuarios). nerdose la tiene como parte del resultado (G-02).
- **Bilingüe ES/EN con textos naturales en cada idioma** — Ninguno de los directos verificados lo documenta; Termo es monolingüe y su caso muestra el costo de variantes regionales.
- **Sin cuenta, sin ads, sin notificaciones desde v1** — Alineado con Termo; Wordle y Connections ofrecen cuenta opcional y suscripción. Es una oportunidad, no una decisión.

## Anti-patrones Detectados

- **Racha que se corta al perder** — Wordle y Connections cuentan victorias consecutivas. Una derrota borra la constancia, lo que penaliza el juego difícil. nerdose ya difiere (decisión #3).
- **Cuenta como condición para conservar el progreso entre dispositivos** — Wordle y Connections requieren login para sincronizar. En nerdose el anónimo puede perder racha al cambiar de dispositivo o borrar la cookie; es un riesgo propio a investigar, no solo un anti-patrón ajeno.
- **Ranking público de resolutores** — Dev Wordle. Introduce competencia que nerdose dejó fuera de v1 (alcance).
- **Modo aleatorio ilimitado junto al diario** — Dev Wordle. Compite con el hábito de un desafío por día (G-01, decisión #19).
- **Desafío que exige escribir código completo** — Codele (por su descripción). No encaja con partidas de 1-3 minutos en teléfono ni con jugadores que no programan.

## Limitaciones del Benchmark

- **Todas las referencias:** Se verificaron por documentación pública y búsqueda web, no usando los productos. No se observaron interfaces, pantallas ni interacciones táctiles reales; por eso este documento no describe layouts ni UI.
- **Wordle y Connections (mobile):** No se pudo verificar la experiencia en teléfono ni el formato exacto del texto compartido; la ayuda oficial solo dice que se copia o se abre el share del dispositivo. El detalle de "sin spoilers" en Connections proviene de una guía de terceros.
- **Dev Wordle:** Fuente única, una página del sitio mismo vía lectura automática. No se verificó el autor, la actividad actual, la cantidad de jugadores ni si funciona bien en teléfono.
- **Codele:** Solo la ficha de Product Hunt. No se verificó racha, compartir, cuenta ni duración típica de una partida; la ficha no los menciona. Otros resultados (Codle, CodeGolfDaily, también en Product Hunt) aparecieron en la búsqueda pero no se revisaron en detalle.
- **Heardle y otros juegos diarios tech:** No se investigaron; Heardle no se relevó. Quedan fuera juegos como Grep Grid o Big O con equivalentes directos: no se encontró un referente verificado para lectura de código, complejidad algorítmica ni sopa de letras tech. Falta una búsqueda dedicada.
- **Duolingo y otras apps de rachas:** Se buscó el detalle de rachas de Duolingo; la ayuda oficial no se pudo consultar (redirección) y las fuentes de terceros se contradicen (precios, reparación). Se excluyó del documento. Falta cerrar este gap si se decide diseñar recordatorios o protección de racha.
- **LeetCode:** Fuentes oficiales antiguas y una guía no oficial que menciona otro horario de corte; el reglamento vigente no se confirmó.
- **Uso real por la audiencia:** No hay evidencia de cuáles de estos productos usa efectivamente el jugador de nerdose. La lista es hipótesis; validar con entrevistas cortas.

---

**Próximo artefacto:** Este benchmark alimenta `research-context.md` de la misma audiencia con material concreto para inferir pains, gains y JTBDs.
