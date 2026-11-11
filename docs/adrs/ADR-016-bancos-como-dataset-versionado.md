# ADR-016: Bancos de contenido como dataset versionado, sin Wikimedia en producción

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** contenido, bancos, wikidata, dataset, devdle

## Contexto

Los bancos `terms` (Devdle y Grep Grid) y `timeline_facts` (Tech Timeline) necesitan textos en ES y EN (definición, resumen, nota) y fechas confiables. La fuente son datos abiertos: Wikidata (CC0) y Wikipedia (CC BY-SA).

El análisis técnico proponía consultar Wikimedia **en producción**:
- un job semanal de reposición cuando el stock alcanzara para menos de un año;
- un job diario que sumaba a la lista de Devdle las palabras rechazadas, verificándolas contra Wikidata y Wiktionary.

Al revisarlo aparecieron tres cosas:
- **Los bancos no se agotan.** Las ventanas anti-repetición liberan los ítems:
  - Devdle no repite un término en 365 días;
  - Grep Grid no repite una palabra en 30 días;
  - Timeline no repite un hecho en 90 días.

  Un banco de unos cientos de ítems alcanza indefinidamente. La reposición semanal resuelve un problema que casi no existe.
- **Depender de una API externa en producción** suma un punto de falla, rate limits y la política de `User-Agent` de Wikimedia, a cambio de contenido que cambia poco.
- **Las alternativas que se revisaron no sirven:**
  - La Wikidata/Wikibase REST API devuelve ítems por ID, pero no permite listar por clase (para eso hace falta SPARQL).
  - Wikimedia Enterprise apunta a uso comercial o de alto volumen y pide cuenta.
  - El listado de Wiktionary en publicapi.dev es un directorio de terceros que apunta a la misma Action API.

## Decisión

**El contenido de los bancos se importa offline y se versiona en el repo.** Ningún servicio desplegado consulta Wikimedia.

1. **Script `import:banks`** en `@nerdose/content`. Se corre a mano en desarrollo:
   - Consulta Wikidata SPARQL según el mapeo clase → categoría (tabla en código).
   - Trae el primer párrafo de Wikipedia (`/api/rest_v1/page/summary/{title}`) en es y en.
   - Aplica las reglas de aceptación (C-50, C-51) y escribe el dataset con cada ítem `approved` o `rejected` (con `rejection_reason`).
2. **Dataset** en `packages/content/data/`:
   - `terms.json`
   - `timeline_facts.json`
   - `manifest.json` (`dataset_version`, `generated_at`, conteos por banco y categoría, parámetros usados)
3. **Carga:** el `generator` corre `sync_banks` al arrancar. Hace UPSERT por `wikidata_id` y lo registra en `job_runs`. Desplegar un dataset nuevo = commit + deploy.
4. **Lista válida de Devdle:** el script `build:wordlist` del paquete `devdle` genera offline el artefacto `wordlist/words.txt`, que se commitea. Es ENABLE filtrado (A–Z, 4–12) ∪ labels en inglés A–Z de conceptos de computación de Wikidata. La `api` lo une con los `terms` `approved`.
5. **Sin ampliación automática:**
   - Se eliminan `word_list_additions` y el job `promote_words`.
   - Los `rejected_guesses` se siguen registrando, y el admin muestra las 50 palabras más rechazadas.
   - Sumar una palabra a la lista base es un cambio de código.

## Reglas de Implementación

- `api` y `generator` MUST NOT hacer requests a dominios de Wikimedia (`*.wikidata.org`, `*.wikipedia.org`, `*.wiktionary.org`). Solo los scripts `import:banks` y `build:wordlist` pueden hacerlo, y MUST NOT importarse desde código de runtime.
- Los scripts MUST mandar `User-Agent: nerdose-content/<dataset_version> (<WIKIMEDIA_CONTACT>)`. `WIKIMEDIA_CONTACT` es una variable de entorno de desarrollo.
- Cada ítem de `terms.json` MUST tener exactamente: `wikidata_id`, `term`, `category`, `definition` (`{es,en}`), `summary` (`{es,en}`), `sitelinks`, `status` (`approved`|`rejected`), `rejection_reason` (string o `null`).
- Cada ítem de `timeline_facts.json` MUST tener exactamente: `wikidata_id`, `label`, `category`, `event_date` (`YYYY-MM-DD`), `date_precision`, `note` (`{es,en}`), `sitelinks`, `status`, `rejection_reason`.
- Los JSON MUST escribirse ordenados por `wikidata_id`, con indentación de 2 espacios y un ítem por bloque, para que los diffs sean legibles.
- `manifest.json` MUST incluir `dataset_version` con el formato `YYYY.MM.DD` (más `-N` si hay varias el mismo día), `generated_at` (ISO 8601) y `min_sitelinks`.
- `import:banks` MUST terminar con error si hay menos de 500 `terms` `approved`, si hay menos de 450 `timeline_facts` `approved` en total (sumando todas las categorías: 5 hechos por desafío × 90 días de ventana anti-repetición de Timeline) o si hay menos de 3 categorías v1. No hay mínimo por categoría de hechos: el desafío de Timeline mezcla categorías, así que entra toda categoría con hechos que pasen el filtro de calidad (cambio del 2026-11-11, que reemplaza el mínimo de 100 por categoría).
- `sync_banks` MUST hacer `INSERT … ON CONFLICT (wikidata_id) DO UPDATE` con estas reglas:
  - Si el ítem en la base está `rejected`, MUST NOT cambiarlo (sigue `rejected`).
  - Si en la base está `approved` y en el dataset `rejected`, pasa a `rejected` con su `rejection_reason`.
  - MUST NOT tocar `last_used_devdle`, `last_used_grep` ni `last_used`.
  - MUST NOT borrar ítems que están en la base y no en el dataset.
- `sync_banks` MUST registrar en `job_runs` (`job = 'sync_banks'`) un `summary` con `dataset_version`, `inserted`, `updated`, `unchanged` y `kept_rejected`.
- `packages/games/devdle/wordlist/words.txt` MUST tener una palabra por línea, en mayúsculas, A–Z, 4–12 letras, ordenadas alfabéticamente y sin duplicados.
- `packages/content/` MUST incluir `LICENSE-DATA.md` con la atribución CC BY-SA 4.0 de los textos derivados de Wikipedia y CC0 de Wikidata.

## Consecuencias

### Positivas
- Producción no depende de ninguna API externa para el contenido. El `generator` no tiene salida de red fuera de la base.
- El dataset se puede revisar en git (diffs), es reproducible y hace fáciles los tests y los entornos locales.
- No hace falta manejar rate limits, reintentos ni cambios de las APIs de Wikimedia en runtime.
- Desaparecen dos jobs y una tabla (`word_list_additions`).

### Negativas
- Sumar contenido nuevo requiere correr el script y desplegar: deja de ser 100% automático. Igual no hay curaduría manual, porque las reglas siguen siendo automáticas.
- La lista de Devdle no aprende sola de los intentos de los jugadores. Hay que mirar las más rechazadas en el admin.
- El repo pesa algunos MB más (dataset + lista de palabras).

### Riesgos
- **Riesgo:** el dataset inicial no llega a los mínimos por poca cobertura en español.
  - **Mitigación:** el script falla y muestra los conteos. Se ajustan el mínimo de `sitelinks` o el mapeo de clases antes del lanzamiento (pregunta abierta del PRD).
- **Riesgo:** un texto importado tiene un error.
  - **Mitigación:** igual que antes: reporte, anulación y el ítem pasa a `rejected`. `sync_banks` nunca lo revive.

## Alternativas Consideradas

### Alternativa 1: Reposición en vivo (propuesta del análisis técnico)

**Pros:**
- El contenido se renueva sin intervención.

**Contras:**
- Dependencia externa en producción para algo que casi nunca hace falta, porque los bancos se reutilizan.

**Por qué se descartó:** costo operativo sin beneficio real.

---

### Alternativa 2: Wikidata/Wikibase REST API

**Pros:**
- API moderna, versionada y con OpenAPI.

**Contras:**
- Solo devuelve ítems por ID. No permite listar "todos los lenguajes de programación" (eso requiere SPARQL).

**Por qué se descartó:** no cubre la necesidad. SPARQL ya devuelve labels, descripciones y sitelinks.

---

### Alternativa 3: Wikimedia Enterprise (snapshots / Structured Contents)

**Pros:**
- Abstracts limpios y snapshots completos.

**Contras:**
- Pide cuenta. Está pensado para uso comercial o de alto volumen, y los snapshots son ediciones enteras de Wikipedia.

**Por qué se descartó:** desproporcionado. El `page/summary` público da el primer párrafo sin cuenta.

---

### Alternativa 4: Mantener la ampliación automática de la lista con un diccionario local más grande

**Pros:**
- Sin API, y la lista "aprende".

**Contras:**
- Si la palabra está en un diccionario local, conviene incluirla directamente en la lista base.

**Por qué se descartó:** no agrega nada frente a una lista base más amplia.

## Referencias

- `docs/discovery/analisis-tecnico.md` — F9, F10 (reemplazados por este ADR), S4 generator
- `docs/prd/requirements.md` — F-15 (C-50, C-51, C-52), C-45
- [Wikidata REST API](https://www.wikidata.org/wiki/Wikidata:REST_API)
- [Wikimedia Enterprise — Wikipedia API](https://enterprise.wikimedia.com/project-data/wikipedia-api/)
- ADR-007 (job `sync_banks`), ADR-012 (lista válida en memoria)
