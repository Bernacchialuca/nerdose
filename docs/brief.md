# Product Brief — Developer Daily Games

## 1. Visión del producto

Crear una plataforma de minijuegos diarios orientados a developers, programadores y entusiastas de la tecnología.

La plataforma será un ecosistema de juegos independientes, cada uno con una mecánica diferente, que pondrán a prueba conocimientos de programación, razonamiento lógico, cultura tecnológica e historia.

La experiencia debe ser rápida, divertida, educativa y social.

Los jugadores podrán completar desafíos diarios, aprender algo nuevo, mantener sus rachas, consultar sus estadísticas y compartir sus resultados.

**La propuesta de valor: una pequeña dosis diaria de nerdiness.**

## 2. Principios del producto

- **Rápido:** cada partida debería durar entre 1 y 3 minutos.
- **Adictivo:** desafíos diarios, estadísticas y rachas.
- **Educativo:** cada juego debe dejar algún aprendizaje.
- **Social:** los resultados deben ser fáciles de compartir.
- **Variado:** no todos los juegos deben requerir conocimientos de programación.
- **Accesible:** cualquier persona interesada en tecnología debería poder participar.
- **Consistente:** todos los jugadores deben enfrentarse al mismo desafío diario dentro de cada minijuego.
- **Automático:** todo el contenido (bancos de palabras, hechos históricos, código y desafíos) se genera, se verifica y se publica solo. No hay una persona a cargo de los juegos.

## 3. Minijuegos iniciales

### 3.1. Devdle

**Adiviná el término técnico del día.**

Una versión de Wordle orientada al mundo developer.

Mecánica:
- Una palabra técnica por día.
- Seis intentos disponibles.
- Solo se aceptan palabras válidas: términos del banco, palabras del diccionario de inglés o términos técnicos conocidos. Si la palabra no está en la lista, se avisa y no consume intento.
- La longitud depende de la respuesta.
- Feedback verde, amarillo y gris.
- Categorías técnicas variadas y aleatorias.
- Al terminar, revelar la categoría, una definición breve y un resumen del concepto. (El ejemplo de uso queda para una versión futura.)

Categorías posibles:
- Lenguajes de programación.
- Git.
- Bases de datos.
- Networking.
- Linux.
- APIs.
- Seguridad.
- Software engineering.

Objetivo: poner a prueba el vocabulario y conocimiento del ecosistema tecnológico.

### 3.2. Bug Hunt

**Hay un bug escondido. ¿En qué línea está?**

Un desafío de lectura de código: el jugador recibe una función corta que no cumple lo que promete y tiene que encontrar la línea con el error.

Mecánica:
- Seleccionar un lenguaje entre Java, Go y JavaScript (Node.js). El bug es el mismo en los tres; cambiar de lenguaje no cambia la respuesta.
- Presentar la especificación de la función: qué debería hacer, en una o dos líneas.
- Presentar la función (8 a 15 líneas) con un único bug.
- Mostrar algunos tests que pasan, como pista para descartar líneas, y avisar que hay un test oculto que falla.
- El jugador toca la línea donde cree que está el bug y confirma.
- **Un solo intento.** Las líneas que solo contienen llaves no se pueden elegir.
- Al confirmar, revelar la línea correcta, el test que falla (esperado vs. obtenido), el fix como diff y una explicación paso a paso.

Tipos de bug:
- Off-by-one (límites de loops y rangos).
- Comparaciones (`<` vs `<=`, `>` vs `>=`).
- Operador equivocado (`+` vs `-`, `&&` vs `||`).
- Variable o índice equivocado.
- Inicialización incorrecta.
- `return` en el lugar incorrecto o condición invertida.

Contenido:
- Los desafíos se generan automáticamente con *mutation testing*: se arma una función correcta a partir de plantillas con parámetros al azar, se generan sus tests ejecutándola y se le aplica una única mutación.
- Solo se acepta una mutación si hace fallar al menos un test en los tres lenguajes. Así se garantiza que el bug existe y que la respuesta es verificable.
- El test que falla se usa como pista y como explicación.
- Cuando el bug está en un caso borde (por ejemplo, empates), los tests visibles no deben cubrirlo.

Resultado compartible:
- Muestra el número de desafío, el lenguaje elegido y si encontró el bug, sin revelar la línea.

Objetivo: entrenar la lectura atenta de código y el razonamiento sobre casos borde, la habilidad que más se usa en el trabajo diario de un developer.

### 3.3. Big O Challenge

**¿Cuál es la complejidad de este algoritmo?**

Se presenta un fragmento de código y el jugador debe identificar su complejidad algorítmica.

Mecánica:
- Seleccionar un lenguaje entre Java, Go y JavaScript (Node.js).
- Presentar un fragmento de código breve.
- Ofrecer distintas notaciones de Big O como opciones.
- Incluir O(1), O(log n), O(n), O(n log n), O(n²), O(2ⁿ), entre otras.
- Utilizar la complejidad temporal como criterio principal.
- Después de responder, mostrar la solución y explicar paso a paso cómo se obtiene.

Los desafíos deben contemplar:
- Loops simples y anidados.
- Recursividad.
- Estructuras de datos.
- Búsquedas y ordenamientos.
- Algoritmos y patrones habituales.

Objetivo: entrenar el análisis de algoritmos y la comprensión de complejidad computacional.

### 3.4. Tech Timeline

**Ordená los acontecimientos de la historia tech.**

Un juego de ordenar cinco elementos según un criterio determinado.

Mecánica:
- Presentar cinco elementos desordenados.
- El jugador debe ordenarlos según la consigna.
- La interacción principal consiste en arrastrar y soltar.
- Al confirmar, mostrar el orden correcto y una breve explicación de cada elemento.
- Otorgar puntos según la cantidad de posiciones correctas.

Ejemplos de desafíos:
- ¿Qué tecnología se creó primero? Java, Docker, Go, Node.js o Python.
- Ordená estos lenguajes por fecha de lanzamiento.
- ¿Qué herramienta de desarrollo apareció primero?
- Ordená estos sistemas operativos cronológicamente.
- ¿Qué empresa fue fundada primero?
- Ordená estos frameworks según su fecha de lanzamiento.
- ¿Cuál de estos videojuegos fue publicado primero?
- ¿Qué acontecimiento histórico de Internet sucedió antes?

Categorías posibles:
- Lenguajes de programación.
- Frameworks y librerías.
- Empresas tecnológicas.
- Sistemas operativos.
- Hardware y computación.
- Internet y redes.
- Videojuegos.
- Historia general de la tecnología.

Objetivo: poner a prueba la cultura tecnológica y el conocimiento histórico.

### 3.5. Grep Grid

**Encontrá los términos técnicos escondidos.**

Una sopa de letras con vocabulario del mundo developer. El nombre viene de `grep`, el comando de Unix para buscar texto.

Mecánica:
- Una grilla de 12×12 letras por día.
- Ocho términos técnicos escondidos, elegidos al azar y sin una categoría o tema en común.
- Las palabras pueden estar en horizontal, vertical o diagonal.
- El jugador toca la primera y la última letra de cada palabra para marcarla.
- La lista de palabras está visible desde el inicio; cada palabra encontrada se tacha.
- Al encontrar una palabra, se revela una definición breve.
- La partida termina al encontrar las ocho palabras.
- El puntaje es el tiempo total.

Ejemplos de palabras:
- KERNEL, DEPLOY, CACHE, MUTEX, REGEX, TOKEN, QUERY, MERGE.

Contenido:
- Los términos salen de un banco de palabras con su definición, que puede compartirse con Devdle.
- La grilla se genera automáticamente a partir de las palabras del día; no requiere armado manual.
- Cada palabra debe aparecer una sola vez en la grilla, para que no haya ambigüedad.

Resultado compartible:
- Muestra el tiempo y la cantidad de palabras encontradas, sin revelar las palabras.

Objetivo: reforzar el vocabulario técnico de forma relajada y accesible, sin requerir conocimientos de programación.

## 4. Futuros minijuegos

Las idea es poder contemplar futuros minijuegos, que sea escalable

### 4.1. Futuras funcionalidades

En el MVP todo el contenido se genera con reglas, sin inteligencia artificial. Más adelante se puede integrar un LLM para generar y validar contenido nuevo: más variedad de código, ejemplos de uso para Devdle, explicaciones mejor redactadas y nuevas mecánicas.

## 5. Identidad independiente de cada minijuego

Cada minijuego debe conservar su propia identidad y sus propias reglas.

No todos los juegos tienen que compartir:
- La misma cantidad de intentos.
- El mismo sistema de puntuación.
- La misma interacción.
- La misma dificultad.
- El mismo formato de respuesta.
- La misma duración exacta.

Cada juego debe tener una mecánica diseñada específicamente para su desafío.

Por ejemplo:
- Devdle utiliza seis intentos y feedback por letras.
- Bug Hunt utiliza la selección de una línea de código, con un solo intento.
- Big O Challenge utiliza selección de respuestas.
- Tech Timeline utiliza ordenamiento de elementos.
- Grep Grid utiliza búsqueda de palabras contra reloj.

La unidad de la plataforma debe estar en la experiencia general, la identidad visual y los sistemas compartidos de progreso, no en repetir una única mecánica.

## 6. Rachas y estadísticas

La plataforma debe tener dos niveles de rachas: individuales por juego y una racha global.

El día de la plataforma se rige por UTC: todos los desafíos cambian a las 00:00 UTC (21:00 en Argentina) y las rachas se cuentan por día UTC.

### 6.1. Racha individual por minijuego

Cada juego debe mantener su propia racha de días consecutivos.

Ejemplo:
- Devdle: 12 días.
- Bug Hunt: 5 días.
- Big O Challenge: 8 días.
- Tech Timeline: 3 días.
- Grep Grid: 6 días.

Completar el desafío diario de un minijuego mantiene o incrementa su racha individual. Perder también cuenta como completar: la racha mide constancia, no aciertos.

Cada juego también debe tener estadísticas propias, adaptadas a su mecánica.

### 6.2. Racha global de la plataforma

Además de las rachas individuales, debe existir una racha global.

La racha global aumenta cuando el jugador completa al menos un desafío diario de cualquier minijuego durante ese día.

Ejemplo:
- Día 1: juega Devdle.
- Día 2: juega Bug Hunt.
- Día 3: juega Big O Challenge.
- Día 4: juega Tech Timeline.

Resultado: mantiene una racha global de cuatro días consecutivos, aunque no haya jugado siempre al mismo juego.

Si un día no completa ningún desafío, la racha global se interrumpe.

La racha global debe incentivar la visita diaria a la plataforma sin obligar a jugar todos los minijuegos.

### 6.3. Estadísticas

Cada jugador debe poder consultar:
- Racha global actual.
- Récord de racha global.
- Rachas actuales por minijuego.
- Cantidad de desafíos completados.
- Porcentaje de victorias o precisión, según el juego.
- Historial de resultados.

Las estadísticas deben adaptarse a la naturaleza de cada minijuego.

## 7. Autenticación

Por ahora no hay autenticación. Pero debe poder ser escalable a ello en un futuro

## 8. Experiencia compartida

Todos los minijuegos deben compartir ciertas características generales:

- Un desafío nuevo por día, publicado a las 00:00 UTC para todos los jugadores.
- Resultados visuales compartibles sin spoilers.
- Explicaciones y aprendizaje al finalizar.
- Estadísticas individuales.
- Rachas individuales y globales.
- Una experiencia visual coherente.
- Una navegación sencilla entre juegos.
- Un botón para reportar un problema con el desafío.
- Disponible en español e inglés.

Cada juego debe tener su propia pantalla de instrucciones, partida y finalización.

Solo se puede jugar el desafío del día: no hay archivo de desafíos pasados.

### 8.1. Idiomas

La plataforma es bilingüe (español e inglés) desde el lanzamiento. Todo el contenido que lee el jugador (consignas, definiciones, explicaciones) debe estar en los dos idiomas. La respuesta de cada desafío es la misma en ambos.

Los textos no tienen que ser traducciones literales: cada idioma debe sonar natural, y lo importante es que signifiquen lo mismo.

### 8.2. Reportes

Los desafíos se generan y se publican automáticamente una vez que pasan la verificación, sin revisión manual. Por eso los jugadores deben poder reportar un problema desde cualquier juego, durante la partida o en el resultado.

- Motivos: la respuesta es incorrecta, la consigna es ambigua, la explicación está mal, error de traducción, algo se ve mal u otro.
- Comentario opcional.
- Cuando un desafío acumula varios reportes, se envía una alerta para revisarlo.
- Si se confirma el error, el desafío se anula: no afecta la racha de nadie ni cuenta como derrota en las estadísticas.

## 9. Página principal

La página principal debe funcionar como un catálogo de minijuegos.

Debe mostrar:
- Identidad de la plataforma.
- Presentación breve del concepto.
- Todos los minijuegos disponibles.
- Descripción breve de cada uno.
- Estado del desafío diario.
- Acceso directo para jugar.
- Racha global del jugador.
- Resumen de progreso.

Los juegos deben presentarse como experiencias independientes dentro de un mismo universo.

La plataforma no debe parecer un dashboard administrativo. Debe sentirse como un producto de entretenimiento digital.

## 10. Principios de diseño de desafíos

1. **Una respuesta verificable:** cada desafío debe tener una solución correcta y no depender de interpretaciones ambiguas.
2. **Aprendizaje:** siempre que tenga sentido, explicar la respuesta y agregar contexto.
3. **Al azar:** no hay una dificultad planificada. Cada día sale un desafío al azar; solo se evita repetir contenido.
4. **Diversidad:** evitar que todos los juegos se centren en un único lenguaje o tecnología.
5. **Contenido confiable:** fechas históricas, complejidades y comportamientos del código deben estar verificados.
6. **Sin frustración innecesaria:** el desafío debe ser difícil por su contenido, no por una consigna confusa.
7. **Compartibilidad:** cada juego debe generar un resultado que se entienda fuera de la plataforma.

## 11. Objetivo del primer lanzamiento

El MVP debe incluir exclusivamente cinco minijuegos:

1. Devdle.
2. Bug Hunt.
3. Big O Challenge.
4. Tech Timeline.
5. Grep Grid.

Los cinco deben estar completos y tener:
- Desafíos diarios.
- Mecánicas propias.
- Reglas y puntuaciones específicas.
- Explicaciones al terminar.
- Resultados compartibles.
- Estadísticas individuales.
- Integración con las rachas globales e individuales.
- Contenido en español e inglés.
- Reporte de problemas.
- Que el resultado no pueda ser accedido desde la web. Es decir, no puede obtener informacion siendo cliente

Los demás juegos quedan como ideas para futuras versiones.

## 12. Objetivo final

Construir un universo de minijuegos diarios para developers que combine entretenimiento, aprendizaje y competencia amistosa.

La plataforma debe ser suficientemente flexible para sumar nuevas experiencias con el tiempo, manteniendo una identidad común sin sacrificar la originalidad de cada minijuego.

**Una plataforma. Múltiples desafíos. Una dosis diaria de nerdiness.**
