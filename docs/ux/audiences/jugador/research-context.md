---
document: UX Research Context
audience: jugador
version: "1.0"
date: 2026-11-03
status: hipótesis-preliminar
---

# Research Context — jugador

> Caracterización de la audiencia. **Todo lo que sigue es hipótesis** hasta
> que se valide con usuarios reales. Cada item está trazado a su fuente
> (PRD, benchmark, input-cliente). Items sin fuente trazable no se incluyen.

## Persona Genérica

- **Rol:** Jugador anónimo (U-01 del PRD): developer, programador o entusiasta de la tecnología. No todos programan; Devdle, Tech Timeline y Grep Grid no lo requieren.
- **Contexto de uso:** Partidas de 1 a 3 minutos sobre el desafío diario, sin registrarse, sobre todo desde el teléfono; también desde escritorio. El día cambia a las 00:00 UTC.
- **Expertise técnico:** Variable. Conoce vocabulario tech en distinto grado; Bug Hunt y Big O suponen saber leer código, los otros tres juegos no.
- **Frecuencia de uso esperada:** Diaria, una visita corta por día, con hasta 5 partidas (una por juego) de 1 a 3 minutos cada una. No hay datos de uso real.
- **Dispositivo principal:** Mobile (primario), con desktop secundario. Usable desde 320 px.

## Jobs To Be Done

1. **Cuando** tengo unos minutos libres en el día, **quiero** resolver un desafío corto de tecnología igual al de todos, **para** sostener un hábito diario sin dedicarle más de 1 a 3 minutos por juego.
   `[fuente: PRD §goals-and-context G-01, U-01]`

2. **Cuando** termino una partida, **quiero** ver la solución con una explicación, **para** aprender algo, aunque haya perdido.
   `[fuente: PRD §goals-and-context G-02; requirements C-12, C-18, C-29, C-32]`

3. **Cuando** completo un desafío, **quiero** compartir mi resultado en un toque sin revelar la respuesta, **para** que otros lo entiendan sin arruinarles el juego.
   `[fuente: PRD §goals-and-context G-05; requirements C-13]`

## Pains

- Pierde la constancia acumulada cuando la racha depende de ganar o de la medianoche local; una derrota o un cambio de huso horario la cortan. `[fuente: benchmark - Wordle y Connections, anti-patrones]`
- Pierde el progreso (rachas e historial) si cambia de dispositivo o borra la cookie, porque no hay cuenta en v1. `[fuente: PRD §requirements - entidad Player; benchmark - anti-patrón de cuenta para sincronizar]`
- Los juegos de código exigen escribir o leer código, lo que deja sin opciones a quien no programa y no entra en una partida corta desde el teléfono. `[fuente: benchmark - Codele; PRD §goals-and-context U-01]`

## Gains

- Ve de un vistazo qué juegos le faltan hoy y cuánto falta para el próximo desafío. `[fuente: PRD §requirements F-02, C-05, C-06]`
- Mantiene su racha aunque pierda o aunque un día no tenga desafío publicado o haya sido anulado. `[fuente: PRD §goals-and-context decisiones #3, #5, #13; requirements C-33]`
- Juega sin crear cuenta y en su idioma (ES o EN), y puede empezar en segundos. `[fuente: PRD §requirements F-01, C-01]`

## Hipótesis de Comportamiento

- El jugador completa los desafíos con una sola visita diaria, en partidas cortas, y vuelve al día siguiente por la racha y el contador visible hasta el próximo desafío. `[estado: hipótesis | fuerza: inferida-PRD]`
- Una racha que cuenta completar (no solo ganar) se percibe como más justa y no desalienta a jugar los desafíos difíciles. `[estado: hipótesis | fuerza: inferida-benchmark]`
- El jugador espera ver sus estadísticas (racha actual, récord, % de victorias, distribución) al terminar cada partida, como en Wordle y Connections. `[estado: hipótesis | fuerza: inferida-benchmark]`
- El jugador comparte su resultado con el share nativo o copiando al portapapeles, y lo hace más cuando el formato no revela la respuesta. `[estado: hipótesis | fuerza: inferida-benchmark]`
- El jugador que cambia de dispositivo o borra la cookie y pierde su racha deja de jugar en vez de reconstruir su historial. `[estado: hipótesis | fuerza: por-analogía]`

## Restricciones de Contexto

- **Pantalla pequeña y toque** — El uso primario es en teléfono, desde 320 px. Selección y confirmación en dos pasos para evitar perder por un toque accidental (decisión #26). `[fuente: PRD §NFR-U01]`
- **Partida corta** — Mediana objetivo de 1 a 3 minutos por juego; un flujo más largo contradice el objetivo. `[fuente: PRD §NFR-U06]`
- **Accesibilidad** — WCAG 2.1 AA, todo jugable con teclado, y feedback que no dependa solo del color. `[fuente: PRD §NFR-U02, NFR-U03, NFR-U04]`
- **Bilingüe** — Todo lo que lee el jugador existe en ES y EN, y el idioma puede cambiar a mitad de partida. `[fuente: PRD §NFR-U05; requirements C-03]`
- **Sin cuenta ni notificaciones** — Identidad por cookie funcional; no hay recordatorios push ni por mail en v1. `[fuente: PRD §goals-and-context Fuera del Alcance]`

## Lo que NO Sabemos

- ¿Cuántos jugadores programan y cuántos no? Determina si Bug Hunt y Big O son un uso frecuente o solo de una parte de la audiencia, y si conviene separar dos audiencias.
- ¿Cuántos juegos juega una persona por día y cuál es el más frecuente? El PRD asume hasta 5 partidas diarias sin datos que lo respalden.
- ¿Qué hace el jugador cuando pierde la racha por borrar la cookie o cambiar de dispositivo? Se asume abandono, sin validar.
- ¿Los jugadores perciben "completar, aunque pierdas" como más justo que la racha de victorias, o lo leen como una racha poco exigente?
- ¿Qué productos usa realmente la audiencia? El benchmark es una lista de partida sin evidencia de uso real.
- ¿Cuánto dura realmente una partida de cada juego en teléfono, en particular Big O y Bug Hunt? La meta de 1 a 3 minutos no está medida.
- ¿Cuánto entienden y aprovechan los jugadores la explicación posterior? Se asume que enseña algo, sin evidencia.

---

**Estado:** Documento en estado `hipótesis-preliminar`. Para promoverlo a `validado`, ejecutar entrevistas reales y actualizar in-place el estado de cada hipótesis.

**Consumido por:** Los `product-map.md` y `user-flows.md` de las superficies que esta audiencia usa (ver matriz en `product-overview.md`).
