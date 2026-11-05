---
created: 2026-11-03
last_updated: 2026-11-03
status: "Draft - In Definition"
---

# Objetivos y Contexto — nerdose

> Derivado del discovery: [análisis funcional](../discovery/analisis-funcional.md) · [análisis de dominio](../discovery/analisis-dominio.md) · [análisis técnico](../discovery/analisis-tecnico.md)

## Información General del Producto

### Nombre

nerdose

### Problema

nerdose nace como proyecto personal: un lugar con juegos diarios cortos sobre programación y tecnología, para tener una pequeña dosis diaria de nerdiness.

**nerdose** es una plataforma web de minijuegos diarios para ese público: *una pequeña dosis diaria de nerdiness*. Cada juego tiene su propia mecánica (vocabulario técnico, lectura de código, complejidad algorítmica, historia tech, sopa de letras) y un único desafío por día, igual para todos. Se juega sin registrarse, mantiene rachas y estadísticas, termina con una explicación que enseña algo y permite compartir el resultado sin spoilers. Todo el contenido se genera, se verifica y se publica automáticamente, en español e inglés.

Es un **proyecto personal, hecho por gusto**: no persigue objetivos de negocio ni de crecimiento, y no tiene monetización.

### Usuarios

- **U-01: Jugador**: developers, programadores y entusiastas de la tecnología. Juega de forma anónima (sin login), sobre todo desde el teléfono, en partidas de 1 a 3 minutos. Quiere un desafío diario, mantener sus rachas, aprender algo y compartir su resultado. No todos los jugadores programan: algunos juegos (Devdle, Tech Timeline, Grep Grid) no lo requieren. Todos los jugadores tienen los mismos permisos.
- **U-02: Responsable de la plataforma**: la única persona que opera nerdose, desde un admin aparte. No carga ni aprueba contenido: revisa los reportes, anula desafíos con errores confirmados, mira los próximos desafíos (y puede regenerarlos), controla el stock de contenido y consulta las métricas.

> En los requerimientos aparece además el actor **Sistema** (generación, verificación y publicación automáticas, y carga de los bancos). No es un usuario.

## Objetivos y Criterios de Éxito

### Objetivos Principales

1. **G-01: Hábito diario breve**: el jugador vuelve todos los días porque hay un desafío nuevo por juego a las 00:00 UTC, cada partida dura entre 1 y 3 minutos, y las rachas y las estadísticas hacen visible su constancia.
2. **G-02: Aprender jugando, con variedad**: cada partida termina con una explicación o algo de contexto, y la plataforma ofrece mecánicas distintas, de modo que cualquier persona interesada en tecnología encuentre juegos para ella, programe o no.
3. **G-03: Juego justo y sin spoilers**: todos los jugadores juegan el mismo desafío por juego y día, el servidor es dueño de la verdad y la solución nunca llega al cliente antes de terminar la partida.
4. **G-04: Contenido 100% automático y confiable**: nadie carga, revisa ni publica contenido a mano. Cada desafío se genera y se verifica automáticamente antes de su fecha, y los reportes de los jugadores son la red de seguridad para detectar y anular los errores.
5. **G-05: Compartible y accesible**: el resultado se comparte en un toque, sin spoilers, y se entiende fuera de la plataforma. Se juega cómodo en el teléfono, con teclado y con lector de pantalla, en español o en inglés.

### Métricas de Éxito

Hay dos tipos de métricas (decisión #1 del análisis funcional):

- **De diseño:** salen de reglas ya definidas y tienen una meta.
- **De seguimiento:** sirven para saber si el producto se usa y si los desafíos funcionan. **No tienen meta**: no son objetivos a cumplir.

| Métrica | Meta | Período | Valida |
|---|---|---|---|
| Desafíos aprobados por anticipado, por juego | ≥ 14 días | Verificación diaria | G-04 |
| Días sin desafío publicado, por juego | 0 (un día sin desafío es una falla, no un caso esperado) | Continuo | G-04 |
| Contenido publicado con textos en ES y EN | 100% | Por desafío | G-04, G-05 |
| Mediana de duración de una partida terminada | Entre 1 y 3 minutos, por juego | Mensual | G-01 |
| Alerta por reportes `wrong_answer` / `ambiguous` | Se dispara con ≥ 3 jugadores distintos o > 5% de las partidas terminadas | Por desafío | G-04 |
| Desafíos anulados | Sin meta: seguimiento | Mensual | G-03, G-04 |
| Tasa de completado y % de victorias por juego y por desafío | Sin meta: seguimiento (detecta desafíos rotos o demasiado difíciles) | Por desafío | G-02, G-04 |
| Jugadores únicos diarios, total y por juego | Sin meta: seguimiento | Diario | G-01, G-02 |
| Retorno D1 y D7 | Sin meta: seguimiento | Por cohorte diaria | G-01 |
| Distribución de rachas globales | Sin meta: seguimiento | Semanal | G-01 |
| Clicks en compartir, por juego | Sin meta: seguimiento (requiere Plausible activado) | Diario | G-05 |
| Accesibilidad | WCAG 2.1 AA | Por release | G-05 |

## Contexto

### Fuentes de contenido externas

- **Wikidata** (CC0), consultada solo por el script de importación offline: fuente de los bancos de términos técnicos (Devdle, Grep Grid) y de hechos históricos (Tech Timeline), y de nombres de conceptos de computación para la lista de palabras válidas de Devdle.
- **Wikipedia** (CC BY-SA): primer párrafo de cada artículo en ES y EN, para definiciones y notas. Requiere atribución en "Acerca de".
- **Diccionario ENABLE** (dominio público): base de la lista de palabras válidas de Devdle.

### Artefactos previos

- `docs/brief.md`: brief original del producto.
- `docs/ARCHITECTURE.md`: arquitectura previa, ya reconciliada en el análisis técnico.
- `docs/nerdose.html`: **prototipo y base del diseño UI/UX** (7 pantallas: Home, Estadísticas, Devdle, Bug Hunt, Big O, Tech Timeline y Grep Grid). Identidad terminal/dev, Inter + JetBrains Mono, acento `#3DDC84`. Es la fuente de verdad visual, formalizada en `docs/design-system/web/`. Ver la decisión #31.

### Decisiones Clave

Decisiones de producto tomadas en el discovery, con su porqué. El registro completo está en [`docs/discovery/analisis-funcional.md`](../discovery/analisis-funcional.md#decisiones-tomadas); las decisiones técnicas, en [`docs/discovery/analisis-tecnico.md`](../discovery/analisis-tecnico.md#resumen-de-decisiones-técnicas).

| # | Tema | Decisión y por qué |
|---|---|---|
| 1 | Objetivo estratégico | Proyecto personal hecho por gusto, sin objetivo de negocio ni monetización. Las métricas son de salud y calidad, no metas, y ninguna decisión de v1 se toma pensando en crecimiento o ingresos |
| 2 | Día de la plataforma | UTC, con cambio a las 00:00. Un único "hoy" para todos simplifica la consistencia y el cálculo de rachas |
| 3 | Completar vs. ganar | Perder también cuenta como completar. La racha mide constancia; el porcentaje de victorias ya mide aciertos |
| 4 | Partida a medias al cambiar el día | No cuenta (ni completada ni derrota) y la jugada tardía se rechaza. Es coherente con "completar = terminar" |
| 5 | Día sin desafío | Día neutro para la racha del juego; para la global, solo si ningún juego tuvo desafío. No se castiga al jugador por un error de la plataforma |
| 6 | Grep Grid: tiempo | Sin tiempo. Puntaje = palabras encontradas (0–8), victoria = 8/8. Más simple y relajado |
| 7 | Grep Grid: abandono | Botón "Rendirse": derrota con N/8, cuenta para la racha y revela las faltantes |
| 8 | Tech Timeline: orden y victoria | Siempre ascendente; puntaje 0–5 y victoria solo con 5/5. Una consigna fija evita confusión |
| 9 | Tech Timeline: categorías v1 | Solo las que Wikidata cubre con calidad. No se fuerza una categoría sin fuente fiable |
| 10 | Lenguaje en Bug Hunt / Big O | Cambio libre durante la partida y preferencia recordada. El lenguaje es solo una vista; la respuesta es la misma en los tres |
| 11 | Formato de share | Emoji del juego + nombre + #número + resultado sin spoilers + nerdose.dev. Formato unificado y reconocible |
| 12 | Número de desafío | Número de día de la plataforma, igual para los 5 juegos |
| 13 | Anulación con partidas en curso | Se cierran como completadas (anuladas): cuentan para la racha, no como victoria ni derrota. El error es de la plataforma |
| 14 | Anulación: decisión | Siempre manual desde el admin; los reportes solo alertan. Evita el abuso coordinado de reportes |
| 15 | Umbral de alerta | ≥ 3 reportes `wrong_answer`/`ambiguous` de jugadores distintos o > 5% de las partidas terminadas, configurable |
| 16 | Publicación | Automática si pasa la verificación, sin revisión humana. Los reportes son la segunda línea de control |
| 17 | Contenido sin LLM | Reglas, datos abiertos y ejecución. Las respuestas tienen que ser verificables |
| 18 | Devdle: palabras válidas | Banco + diccionario + conceptos de Wikidata, armada en build. Un intento rechazado no consume intento y se registra; el admin muestra los más rechazados |
| 19 | Sin archivo | Solo se juega el desafío de hoy. Refuerza el hábito diario y simplifica el anti-spoiler |
| 20 | Autenticación | Jugadores anónimos con identidad en el servidor, separada de usuarios. Cero fricción hoy y migración sin pérdida de datos mañana |
| 21 | Admin | App aparte en un subdominio, con una sola contraseña y sesión de 8 horas. Protege las soluciones de los próximos días |
| 22 | Bilingüe | ES/EN desde el lanzamiento, con textos naturales en cada idioma y la misma solución. Sin los dos idiomas no se publica |
| 23 | Escala objetivo | ~1.000 jugadores diarios con pico a las 00:00 UTC. Alcanza con una instancia |
| 24 | Accesibilidad | Mobile-first + WCAG 2.1 AA + jugable con teclado. El uso diario ocurre sobre todo en el teléfono |
| 25 | Privacidad | Cookie funcional sin PII, sin banner, analítica sin cookies, retención indefinida |
| 26 | Interacciones de un solo intento | Seleccionar y después confirmar (Bug Hunt, Big O, Timeline). Evita perder por un toque accidental |
| 27 | Idioma de la interfaz | Del navegador, cambiable con un selector visible y guardado; se puede cambiar a mitad de partida |
| 28 | Big O: criterio | Complejidad temporal en el peor caso, 8 opciones fijas y O(2ⁿ) para la recursión doble. Garantiza una única respuesta indiscutible |
| 29 | Métricas en el admin | Las métricas de uso, retención y calidad salen de la base y se ven en una sección "Métricas" del admin. Son exactas y no dependen de bloqueadores (análisis técnico) |
| 30 | Analítica web | Plausible Community Edition self-hosted, integrado desde v1 pero apagado por defecto (flag de build). Sin costo de SaaS; se activa cuando esté instalado (análisis técnico) |
| 31 | Diseño UI/UX | El prototipo `docs/nerdose.html` es la fuente de verdad visual (identidad, tipografía, layout, componentes, tono) y se formaliza en el Design System de `web`. Revisado el 2026-11-05: antes era solo una referencia y las primeras pantallas se apartaron de él. En datos, métricas, reglas, textos y accesibilidad manda el PRD. Detalle en NFR-U07 de `requirements.md` |
| 32 | Bancos de contenido | Dataset versionado en el repo, generado offline desde Wikidata y Wikipedia por un script con reglas automáticas, y cargado por el generator al arrancar. Sin APIs de Wikimedia en producción. Los bancos se reutilizan al vencer su ventana anti-repetición, así que no se agotan (análisis de la fase técnica) |

## Alcance

### Dentro del Alcance (v1)

- **5 juegos completos:** Devdle, Bug Hunt, Big O Challenge, Tech Timeline y Grep Grid, cada uno con instrucciones, partida y resultado.
- **Desafío diario por juego**, que cambia a las 00:00 UTC y es igual para todos.
- **Jugadores anónimos** identificados por una cookie funcional.
- **Rachas** por juego y global, **estadísticas** propias de cada juego, heatmap e historial.
- **Share sin spoilers** en cada juego.
- **Bilingüe ES/EN** (interfaz y contenido).
- **Reporte de problemas** por desafío.
- **Generación, verificación y publicación automáticas** del contenido, por reglas.
- **Admin aparte:** reportes y anulación, próximos desafíos, stock de contenido y métricas.
- **Analítica web** con Plausible self-hosted, detrás de un flag (apagado por defecto).
- **Página principal** como catálogo de juegos.

### Fuera del Alcance (v1)

- **Más juegos** (por ejemplo Async Arena): ideas futuras, aunque la plataforma debe permitir sumarlos como módulos.
- **Archivo o replay de desafíos pasados:** fuera de alcance por diseño (decisión #19).
- **Registro, login y cuentas de jugador:** diferido; el modelo separa jugador de usuario para migrar sin pérdida.
- **Rankings y competencia entre jugadores:** diferido; si se suman, van atados a cuentas autenticadas.
- **Ejemplo de uso en Devdle:** post-MVP.
- **Generación o validación de contenido con LLM:** post-MVP, siempre offline y verificado.
- **Más idiomas** que ES y EN.
- **Despublicación automática por reportes:** nunca (decisión #14).
- **Dificultad planificada o niveles de dificultad.**
- **Admin multiusuario o con roles.**
- **Monetización** (ads, premium, sponsors).
- **Notificaciones push o recordatorios por mail.**
- **Categorías de Timeline "Hitos de Internet" e "Historia general":** diferidas hasta tener una fuente automática fiable.
- **Alertas por webhook (Discord/Slack) o push:** v1 avisa solo por mail (SMTP con nodemailer).

### Restricciones

- **Tiempo y presupuesto:** proyecto personal, sin plazo ni presupuesto definidos.
- **Equipo:** una sola persona (desarrollo y operación). Por eso nada del contenido puede depender de trabajo manual.
- **Tecnología:** TypeScript en front, back y generador; PostgreSQL como única base; el generador necesita Node, Go y JDK para ejecutar los snippets de Big O y Bug Hunt. Una sola instancia de API para ~1.000 jugadores diarios. Detalle en el análisis técnico.
- **Contenido permitido:** datos abiertos de Wikidata y Wikipedia (CC0 y CC BY-SA, con atribución), diccionarios de inglés de licencia libre y nombres de tecnologías y empresas como referencia factual.
- **Contenido prohibido:** exponer al cliente cualquier dato que revele la solución antes de terminar, y permitir predecir desafíos futuros a partir del código público (el seed depende de un secreto fuera del repo).
- **Privacidad:** sin PII, una única cookie funcional y sin banner de cookies.
- **Accesibilidad:** WCAG 2.1 AA, mobile-first y todo jugable con teclado.
- **Diseño:** la UI/UX se basa en el prototipo `docs/nerdose.html` (decisión #31).
- **Dominios:** `nerdose.dev` (jugadores) y `admin.nerdose.dev` (admin).
