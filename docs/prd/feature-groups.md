---
created: 2026-11-03
last_updated: 2026-11-25
status: "Pending Formalization"
---

# Feature Groups — nerdose

> Derivado del discovery: [análisis funcional](../discovery/analisis-funcional.md) · [análisis de dominio](../discovery/analisis-dominio.md)

## Overview

Este documento contiene los feature groups identificados durante la inicialización de nerdose.

**Los feature groups son agrupaciones de funcionalidad relacionada** que se capturan como requests, se diseñan técnicamente y se formalizan en stories antes de implementarse.

**Proceso para formalizar cada feature group:**
1. `/product-new-request`: capturar el requerimiento y clarificar el alcance
2. `/product-design-request REQ-XXX`: diseñar la solución técnica y proponer el story split
3. `/product-create-stories REQ-XXX`: crear las stories implementables

**Status actual:** 10 feature groups pendientes de formalización. Las 53 capabilities de `requirements.md` (C-01 a C-53) están asignadas, cada una a un solo grupo. C-53 (analítica web) quedó retirada de v1 en REQ-011.

---

## Feature Group 1: Walking skeleton

**Status:** Pending

**Descripción:**
Levantar **en local** la base técnica mínima de los 4 servicios definidos en el análisis técnico, conectados entre sí:
- `api` (Node + Hono) con `/api/health` y `/api/admin/health`;
- `web` (React + Vite) con el shell vacío y los tokens de la identidad visual del prototipo;
- `admin` con una pantalla vacía;
- `generator` como worker que arranca su scheduler sin jobs;
- PostgreSQL 16 en Docker Compose, con el sistema de migraciones y los tres roles (`nerdose_owner`, `nerdose_api`, `nerdose_generator`).

Incluye el monorepo (pnpm workspaces + Turborepo, ADR-003), los componentes compartidos vacíos (`core`, `db`, `ui`) y el contrato `GameDefinition` sin juegos registrados.

El mismo origen se emula en local con el proxy de Vite: `web` reenvía `/api/*` a la `api`, y `admin` reenvía `/api/admin/*` a la misma `api`.

**Fuera de alcance de este grupo:** despliegue, hosting, CI/CD, DNS/TLS, y gestión de secretos en producción. Son decisiones diferidas, sin feature group asignado. Tampoco incluye funcionalidad de negocio.

**¿Por qué es importante?:**
- Todo lo demás se construye sobre esta base.
- Fija la estructura del repo, los scripts de desarrollo y las migraciones con roles (ADR-003, ADR-004) antes de sumar lógica.
- Valida en local el enrutamiento de mismo origen, del que dependen la cookie y el JWT.

**Capabilities que implementa:**
- Ninguna capability de negocio.
- Base de NFR-SC01 (una instancia de API + PostgreSQL) y NFR-U07 (tokens visuales del prototipo).

**Precondiciones:**
- Ninguna (es el primer feature group).
- Documentación técnica generada por `/product-initialize-technical`.
- Node 24, pnpm y Docker instalados en la máquina de desarrollo.

**Postcondiciones:**
- Monorepo con la estructura de ADR-003 (`apps/{web,admin,api,generator}`, `packages/{core,db,ui}`).
- `docker compose up` levanta PostgreSQL 16; `pnpm --filter @nerdose/db db:migrate` aplica las migraciones y crea los roles `nerdose_api` y `nerdose_generator` con sus `GRANT`.
- `pnpm dev` levanta `web`, `admin`, `api` y `generator` en local; `api` y `generator` se conectan con su propio rol.
- En local, `GET /api/health` responde desde el origen de `web` y `GET /api/admin/health` desde el origen de `admin`, ambos con `{ "status": "ok", "db": "ok" }`.
- `generator` corre con el scheduler activo y sin jobs, y cierra ordenadamente con `SIGTERM`.
- `pnpm lint`, `pnpm typecheck` y `pnpm test` (Vitest) pasan en todo el monorepo.
- `.env.example` documenta todas las variables de entorno de `api` y `generator`, que se validan al arrancar.
- Paquetes `core`, `db` y `ui` y el contrato `GameDefinition` disponibles para los grupos siguientes.

**Valor entregado:**
Los 4 servicios corren en local, conectados a la base, con la identidad visual en el shell. Todavía no hay nada para jugar ni nada desplegado.

---

## Feature Group 2: Plataforma base y catálogo

**Status:** Pending

**Descripción:**
La experiencia de entrada a nerdose: el jugador entra sin registrarse, se le crea un Player anónimo con su cookie funcional, la interfaz se muestra en su idioma (ES/EN) y puede cambiarlo. La home funciona como catálogo, con los 5 juegos, su estado del día (todos "sin desafío" hasta que existan generadores), la racha global, el número de desafío y la cuenta regresiva a las 00:00 UTC.

Incluye "Acerca de" con la atribución de Wikipedia/Wikidata, el aviso de privacidad (dentro de "Acerca de") y el aviso de cookies bloqueadas.

**¿Por qué es importante?:**
- Es la puerta de entrada y la identidad del producto: cada juego después se monta sobre este shell.
- Fija el "día de la plataforma" y el número de desafío, de los que dependen todos los juegos y las rachas.
- Valida la sesión anónima y el i18n de punta a punta antes de sumar lógica de juego.

**Capabilities que implementa:**
- C-01: Crear o renovar la sesión anónima (de F-01)
- C-02: Detectar cookies bloqueadas (de F-01)
- C-03: Cambiar preferencias (de F-01)
- C-04: Resolver el idioma de cada respuesta (de F-01)
- C-05: Ver el estado del día (de F-02)
- C-06: Cuenta regresiva y cambio de día (de F-02)
- C-07: Ver "Acerca de" y aviso de privacidad (de F-02)

**Precondiciones:**
- FG-1 completo.
- Fecha de lanzamiento definida (pregunta abierta), o un valor provisorio configurable.

**Postcondiciones:**
- Entidad Player persistida; cookie `nd_pid` funcionando con rate limit en la creación.
- Endpoints de sesión, estado del día y preferencias disponibles.
- Home con los 5 juegos, la racha global, el `#número` y la cuenta regresiva, en ES y EN.
- i18n de la interfaz funcionando (detección, selector y persistencia).

**Valor entregado:**
El jugador entra a nerdose.dev, ve el catálogo de juegos en su idioma, la cuenta regresiva al próximo desafío y la sección "Acerca de".

---

## Feature Group 3: Devdle de punta a punta

**Status:** Pending

**Descripción:**
El primer juego jugable y, con él, toda la maquinaria común. El banco de términos sale del dataset importado offline desde Wikidata y Wikipedia, que el generator carga en la base. El generator genera, verifica y aprueba los desafíos de Devdle de los próximos 14 días, y la API los publica al cambiar el día. El jugador abre Devdle, intenta palabras validadas contra la lista válida (los rechazos no consumen intento y se registran), recibe feedback por letra, termina la partida, ve la palabra con su explicación, comparte el resultado y ve sus rachas actualizadas.

Este grupo valida el contrato `GameDefinition` completo y el ciclo común (empezar, retomar, jugada tardía, cierre en una transacción con rachas). Los juegos siguientes lo reutilizan.

**¿Por qué es importante?:**
- Prueba de punta a punta las tres ideas centrales: el servidor es dueño de la verdad, el contenido se genera antes de publicarse y cada juego es un módulo enchufable.
- Entrega la primera experiencia completa: jugar, aprender, compartir y mantener una racha.
- Es el grupo más grande (probablemente ~8 stories) porque Devdle necesita de una vez el banco, el pipeline y el ciclo común. Se decidió mantenerlo unido para que entregue valor visible.

**Capabilities que implementa:**
- C-08: Abrir el juego de hoy (de F-03)
- C-09: Empezar la partida (de F-03)
- C-10: Retomar la partida (de F-03)
- C-11: Hacer una jugada (de F-03)
- C-12: Cerrar la partida y mostrar el resultado (de F-03)
- C-13: Compartir el resultado (de F-03)
- C-14: Mostrar "sin desafío hoy" (de F-03)
- C-15: Intentar una palabra (de F-04)
- C-16: Registrar un intento rechazado (de F-04)
- C-17: Elegir la respuesta del día (de F-04)
- C-18: Ver el resultado de Devdle (de F-04)
- C-54: Pedir una pista de letra (de F-04; **agregada después de v1, REQ-012**)
- C-55: Rendirse en Devdle (de F-04; **agregada después de v1, REQ-012**)
- C-33: Actualizar rachas y stats al completar (de F-09)
- C-47: Generar y verificar los próximos 14 días (de F-14)
- C-48: Publicar el desafío del día (de F-14)
- C-50: Importar el banco de términos (de F-15)
- C-52: Cargar los bancos en la base (de F-15)
- NFR-S01, NFR-S02, NFR-S03, NFR-S08 (anti-spoiler, validación en el servidor, seed con secreto, rate limit de jugadas)

**Precondiciones:**
- FG-2 completo (sesión, día de la plataforma, home).
- Mínimo de `sitelinks` y lista de exclusión iniciales definidos (preguntas abiertas), o valores provisorios configurables.

**Postcondiciones:**
- Entidades Challenge, Play, PlayerGameStats, PlayerStats, Term y RejectedGuess persistidas.
- Dataset de términos en el repo, cargado por el generator al arrancar; job de relleno de 14 días corriendo en el generator; publicación al cambiar el día en la API.
- Endpoints de juego (`today`, `start`, `move`) genéricos sobre el registry de `GameDefinition`.
- Lista de palabras válidas de Devdle cargada en la API (base + términos aprobados).
- Rachas por juego y global con días neutros, actualizadas en la misma transacción que cierra la Play.

**Valor entregado:**
El jugador juega Devdle todos los días con un desafío nuevo generado solo, ve la explicación del término, comparte su grilla y mantiene sus rachas. La home muestra el estado real de Devdle.

---

## Feature Group 4: Grep Grid

**Status:** Pending

**Descripción:**
Segundo juego: una sopa de letras de 12×12 con 8 términos técnicos del mismo banco de Devdle, sin tiempo. El jugador toca la primera y la última letra de cada palabra, el servidor valida la selección y la partida termina al encontrar las 8 o al rendirse.

**¿Por qué es importante?:**
- Suma un juego que no requiere programar (principio "Variado").
- Valida que el contrato `GameDefinition` y el ciclo común sirven para un juego de varias jugadas con un estado distinto, sin tocar la API ni el shell.

**Capabilities que implementa:**
- C-19: Seleccionar una palabra (de F-05)
- C-20: Rendirse (de F-05)
- C-21: Generar la grilla del día (de F-05)
- C-22: Ver el resultado de Grep Grid (de F-05)

**Precondiciones:**
- FG-3 completo (banco de términos, pipeline de generación, ciclo común, rachas).

**Postcondiciones:**
- Paquete `grep-grid` registrado (definition, client, generator).
- Desafíos de Grep Grid generados y verificados (cada palabra exactamente una vez) para los próximos 14 días.

**Valor entregado:**
El jugador juega Grep Grid a su ritmo, puede rendirse, ve las definiciones de las palabras que encuentra y comparte su `N/8`.

---

## Feature Group 5: Tech Timeline

**Status:** Pending

**Descripción:**
Tercer juego: ordenar 5 hitos de la historia tech del más antiguo al más reciente, en un solo intento, con drag & drop por touch y teclado. Incluye el banco de hechos (`TimelineFact`), importado offline desde Wikidata con fechas sin ambigüedad.

**¿Por qué es importante?:**
- Suma otro juego que no requiere programar y que enseña historia tech.
- Valida un segundo banco de contenido automático y la interacción de drag & drop accesible (NFR-U03).

**Capabilities que implementa:**
- C-23: Ordenar y confirmar (de F-06)
- C-24: Generar el desafío del día (de F-06)
- C-25: Ver el resultado de Tech Timeline (de F-06)
- C-51: Importar el banco de hechos (de F-15)

**Precondiciones:**
- FG-3 completo (pipeline de generación y ciclo común).
- Cobertura de Wikidata para las categorías de Timeline validada (pregunta abierta).

**Postcondiciones:**
- Entidad TimelineFact persistida y dataset de hechos en el repo, cargado por el generator.
- Paquete `timeline` registrado, con `opaque_id` aleatorios por desafío.

**Valor entregado:**
El jugador ordena hitos de la historia tech con el dedo o con el teclado, ve las fechas y las notas de cada uno, y comparte su `N/5`.

---

## Feature Group 6: Reportes y anulación

**Status:** Pending

**Descripción:**
La red de seguridad de la publicación automática. Los jugadores reportan un problema durante la partida o en el resultado. Al alcanzar el umbral, el desafío queda marcado como alertado y aparece destacado en el admin (sin mail). Desde el admin (`admin.nerdose.dev`, con contraseña única y sesión de 8 h) ve los reportes agrupados por desafío, los resuelve o descarta, y puede anular un desafío. Al anularlo se cierran sus partidas, se recalculan los agregados, el ítem culpable pasa a `rejected` y los jugadores pueden marcarlo como completado sin perder la racha.

**¿Por qué es importante?:**
- Sin revisión humana (decisión #16), los reportes son la segunda línea de control de calidad.
- Con 3 juegos publicando solos, conviene tener la anulación antes de sumar los juegos de código, que son los más propensos a errores.

**Capabilities que implementa:**
- C-35: Recalcular agregados (de F-09)
- C-36: Reportar un problema (de F-10)
- C-37: Alertar al alcanzar el umbral (de F-10)
- C-38: Iniciar sesión en el admin (de F-11)
- C-39: Ver reportes agrupados (de F-11)
- C-40: Resolver o descartar un reporte (de F-11)
- C-41: Anular un desafío (de F-11)
- C-42: Marcar un desafío anulado como completado (de F-11)
- NFR-S07 (acceso al admin)

**Precondiciones:**
- FG-3 completo (Challenge, Play y agregados). Idealmente FG-4 y FG-5, para cubrir los culpables `term` y `timeline_fact`.

**Postcondiciones:**
- Entidad ChallengeReport persistida; umbral de alerta configurable funcionando, con los desafíos alertados visibles en la sección Reportes.
- Admin desplegado con login JWT y la sección Reportes.
- Anulación con recálculo de agregados y rechazo del ítem culpable.

**Valor entregado:**
El jugador avisa cuando un desafío está mal. El Responsable ve en el admin qué desafíos alcanzaron el umbral, revisa los reportes con la solución a la vista y anula el desafío sin afectar las rachas de nadie.

---

## Feature Group 7: Admin — operación del contenido

**Status:** Pending

**Descripción:**
Visibilidad y control sobre el contenido automático: ver los próximos 14 días de cada juego (preview real con la solución, en ES y EN, con su log de verificación) y regenerar un desafío aprobado; ver el stock de los bancos, la última carga del dataset y las palabras más rechazadas en Devdle; y ver en el admin las fallas de generación: si el generator no logra el desafío de mañana, queda registrada y se muestra (sin mail).

**¿Por qué es importante?:**
- Permite detectar problemas *antes* de que se publiquen, sin cargar nada a mano.
- La alerta de falla de generación evita descubrir un "sin desafío hoy" recién al cambiar el día.
- Conviene tenerlo antes de los juegos de código, que son los que más pueden fallar en la verificación.

**Capabilities que implementa:**
- C-43: Ver los próximos desafíos (de F-12)
- C-44: Regenerar un desafío (de F-12)
- C-45: Ver el stock de contenido (de F-12)
- C-56: Explorar los bancos de contenido (de F-12; **agregada después de v1, REQ-012**)
- C-49: Alertar una falla de generación (de F-14)

**Precondiciones:**
- FG-6 completo (admin con login).
- FG-3 a FG-5 completos (generadores y bancos que mostrar).

**Postcondiciones:**
- Secciones Próximos desafíos y Stock en el admin.
- Pedidos de regeneración atendidos por el generator con reemplazo atómico.
- Fallas de generación registradas (una por juego y fecha) y visibles en Próximos desafíos.

**Valor entregado:**
El Responsable ve qué se va a publicar en los próximos 14 días, regenera un desafío que no le convence, controla cuánto contenido queda y se entera a tiempo si un juego se queda sin desafío. Ve qué palabras intentan los jugadores y Devdle no acepta, para sumarlas a la lista base si corresponde.

---

## Feature Group 8: Big O Challenge

**Status:** Pending

**Descripción:**
Cuarto juego: identificar la complejidad temporal en el peor caso de un fragmento de código, en JS, Go o Java. Incluye la infraestructura `polyglot`: el árbol de código, los emisores a los 3 lenguajes (misma línea por sentencia) y el runner que compila y ejecuta en el generator. Incluye también el catálogo de bloques con su costo, la generación por recetas y la verificación ejecutando con varios tamaños de entrada.

**¿Por qué es importante?:**
- Es el primer juego que **inventa** su contenido en lugar de elegirlo de un banco, con la verificación por ejecución como garantía (decisión #17).
- Construye la infraestructura multi-lenguaje que reutiliza Bug Hunt.

**Capabilities que implementa:**
- C-26: Cambiar el lenguaje del código (de F-07)
- C-27: Elegir la complejidad y confirmar (de F-07)
- C-28: Generar el desafío del día (de F-07)
- C-29: Ver el resultado de Big O (de F-07)

**Precondiciones:**
- FG-3 completo (pipeline de generación y ciclo común).
- Toolchains Node, Go y JDK disponibles en el entorno del generator.

**Postcondiciones:**
- Paquete `polyglot` (árbol, 3 emisores y runner) disponible.
- Paquete `big-o` registrado, con su catálogo de bloques y la verificación ejecutando.
- Preferencia de lenguaje de código guardada al confirmar.

**Valor entregado:**
El jugador lee un fragmento de código en su lenguaje preferido, elige su complejidad y aprende con la explicación paso a paso.

---

## Feature Group 9: Bug Hunt

**Status:** Pending

**Descripción:**
Quinto juego: encontrar la línea con el bug en una función corta. Se genera con mutation testing sobre `polyglot`: plantillas de funciones correctas con parámetros, una mutación y tests generados ejecutando la versión correcta, con verificación en los 3 lenguajes. Muestra la especificación, la función, los tests visibles y el aviso del test oculto; el resultado trae el test que falla, el fix como diff y la explicación.

**¿Por qué es importante?:**
- Completa los 5 juegos de v1.
- Entrena la lectura atenta de código, la habilidad más usada en el trabajo diario de un developer.

**Capabilities que implementa:**
- C-30: Elegir la línea y confirmar (de F-08)
- C-31: Generar el desafío del día (de F-08)
- C-32: Ver el resultado de Bug Hunt (de F-08)

**Precondiciones:**
- FG-8 completo (infraestructura `polyglot` y selector de lenguaje).

**Postcondiciones:**
- Paquete `bug-hunt` registrado, con sus plantillas, el catálogo de mutaciones y la verificación de mutantes.

**Valor entregado:**
El jugador busca el bug en una función de 8 a 15 líneas, en su lenguaje preferido, y ve por qué falla con el test, el diff y la explicación.

---

## Feature Group 10: Estadísticas, métricas y analítica

**Status:** Pending

**Descripción:**
Cierra la experiencia de progreso y la medición. El jugador tiene la pantalla de estadísticas completa: rachas y récords por juego y global, completados, porcentaje de victorias, stats propias de cada juego, heatmap de los últimos 365 días e historial con etiquetas cortas. El Responsable tiene la sección Métricas del admin (jugadores diarios, retención D1/D7, distribución de rachas y calidad por desafío). Incluye el pulido mobile y de accesibilidad de toda la plataforma. La analítica web (Plausible, C-53) se retiró en REQ-011 por decisión del usuario: v1 no la incluye y se elimina el código existente.

**¿Por qué es importante?:**
- Las estadísticas completas son uno de los motivos para volver todos los días (G-01).
- Las métricas permiten saber si el producto se usa y si los desafíos funcionan, sin depender de una analítica externa.
- Con los 5 juegos ya hechos, el pulido de accesibilidad y mobile se hace sobre la plataforma completa.

**Capabilities que implementa:**
- C-34: Ver estadísticas (de F-09)
- C-46: Ver métricas (de F-13)
- ~~C-53: Registrar visitas y shares (de F-16)~~ — retirada en v1 (REQ-011)
- NFR-U01 a NFR-U04 (pulido mobile, WCAG 2.1 AA, teclado, color)

**Precondiciones:**
- FG-3 a FG-9 completos (los 5 juegos generan Play y stats propias).
- FG-6 completo (admin con login).

**Postcondiciones:**
- Pantalla de estadísticas con heatmap e historial paginado.
- Vistas `metrics_*` en la base y sección Métricas en el admin.
- Sin analítica web: helper `track()`, Plausible y `VITE_PLAUSIBLE_*` eliminados.
- Auditoría de accesibilidad (axe-core) sin violaciones, con informe en `docs/audits/`.

**Valor entregado:**
El jugador consulta todo su progreso, con heatmap e historial. El Responsable ve cuánta gente juega, si vuelve y qué desafíos fallan. La plataforma no carga analítica de terceros.

---

## Notas de Secuenciamiento

**FG-1 (Walking skeleton)** va primero: sin los 4 servicios corriendo y conectados en local no se puede construir nada. El despliegue (hosting, CI/CD, secretos) queda diferido y se define cuando se decida lanzar; no bloquea ningún feature group.

**FG-2 (Plataforma base)** depende de FG-1 y es prerequisito de todo lo que tiene jugador: sesión, día de la plataforma e i18n.

**FG-3 (Devdle)** es el grupo central: construye el banco de términos, el pipeline de generación y publicación, el ciclo común y las rachas. Todos los juegos posteriores dependen de él.

**FG-4 (Grep Grid)** y **FG-5 (Tech Timeline)** dependen solo de FG-3 y pueden hacerse en cualquier orden, o en paralelo.

**FG-6 (Reportes y anulación)** puede empezar después de FG-3, pero conviene después de FG-4 y FG-5 para cubrir todos los tipos de culpable. Va antes de los juegos de código para tener la red de seguridad lista.

**FG-7 (Operación del contenido)** depende de FG-6 (admin con login) y de los generadores existentes.

**FG-8 (Big O)** depende de FG-3, y **FG-9 (Bug Hunt)** depende de FG-8 (infraestructura `polyglot`). Técnicamente FG-8 podría empezar en paralelo con FG-6 y FG-7.

**FG-10 (Estadísticas, métricas y analítica)** va al final porque necesita los 5 juegos generando datos. Si se quiere la pantalla de stats antes, C-34 se puede adelantar a continuación de FG-3 sin cambiar dependencias.

**Hito de lanzamiento:** el lanzamiento público puede hacerse después de FG-6 (3 juegos + red de seguridad) o después de FG-9 (los 5 juegos). La fecha de lanzamiento define el desafío #1.
