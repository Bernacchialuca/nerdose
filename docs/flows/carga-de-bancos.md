---
id: carga-de-bancos
title: Importación offline y carga de los bancos de contenido
type: event
status: Draft
created: 2026-11-03
last_updated: 2026-11-03
stories: []
---

# Importación offline y carga de los bancos de contenido

**Tipo:** Evento
**Status:** Draft
**Creado:** 2026-11-03
**Última actualización:** 2026-11-03
**Stories:** —

## Descripción

Los bancos `terms` y `timeline_facts` salen de un dataset versionado en el repo. En desarrollo, el script `import:banks` lo genera desde Wikidata y Wikipedia con reglas automáticas, y se commitea. En producción, el `generator` lo carga en la base al arrancar (`sync_banks`). Ningún servicio desplegado consulta Wikimedia. Cubre C-50, C-51 y C-52 (ADR-016, reemplaza F9 y F10 del análisis técnico).

## Servicios Involucrados

| Servicio | Rol | Tipo de Participación |
|----------|-----|-----------------------|
| script `import:banks` (`@nerdose/content`, desarrollo) | Consulta Wikimedia, aplica las reglas y escribe el dataset | Iniciador (offline) |
| Wikidata SPARQL / Wikipedia REST | Fuentes de datos abiertos (solo en desarrollo) | Procesador externo |
| generator | Carga el dataset en la base al arrancar | Procesador |
| nerdose-db | `terms`, `timeline_facts`, `job_runs` | Procesador |

## Pasos del Flujo

```mermaid
sequenceDiagram
    participant S as import:banks (dev)
    participant WD as Wikidata SPARQL
    participant WP as Wikipedia REST
    participant R as repo (@nerdose/content)
    participant G as generator
    participant DB as nerdose-db

    S->>WD: SPARQL por clase (mapeo clase → categoría)
    WD-->>S: wikidata_id, labels, descripciones, sitelinks, artículos, P571/P577
    S->>WP: GET /api/rest_v1/page/summary/{title} (es, en)
    WP-->>S: extract
    S->>S: reglas de aceptación → approved | rejected (rejection_reason)
    alt menos de 500 terms o de 100 hechos por categoría
        S-->>S: termina con error (no escribe)
    else
        S->>R: data/terms.json, data/timeline_facts.json, data/manifest.json
    end
    Note over R,G: commit + deploy
    G->>DB: pg_try_advisory_lock('sync_banks'); INSERT job_runs
    G->>DB: INSERT ... ON CONFLICT (wikidata_id) DO UPDATE (reglas de ADR-016)
    G->>DB: UPDATE job_runs SET summary
    G->>G: habilita fill
```

### Paso 1: Importar (desarrollo, a mano)

**Origen:** script `import:banks`
**Destino:** Wikidata SPARQL, Wikipedia REST
**Tipo:** REST (externo, solo en desarrollo)

**Requests:**
- `GET https://query.wikidata.org/sparql?query=…` por cada clase del mapeo clase → categoría
- `GET https://{es|en}.wikipedia.org/api/rest_v1/page/summary/{title}`
- **Header:** `User-Agent: nerdose-content/<dataset_version> (<WIKIMEDIA_CONTACT>)`

**Reglas de aceptación:**
- `terms`: label en inglés pasado a mayúsculas, solo A–Z y de 4 a 12 letras; descripción y artículo en ES y EN; `sitelinks >= min_sitelinks`; no está en la lista de exclusión; no es duplicado. Si no cumple, `status = 'rejected'` con `rejection_reason`.
- `timeline_facts`: una sola fecha (P571 o P577) sin contradicciones, con `date_precision`; `sitelinks >= min_sitelinks`; nota en ES y EN. Si la nota menciona otro año, se usa la descripción corta.

---

### Paso 2: Escribir el dataset

**Origen:** script `import:banks`
**Destino:** repo (`packages/content/data/`)
**Tipo:** Interno

**Archivos:**
- `terms.json`: `[{ "wikidata_id", "term", "category", "definition": { "es", "en" }, "summary": { "es", "en" }, "sitelinks", "status", "rejection_reason" }]`
- `timeline_facts.json`: `[{ "wikidata_id", "label", "category", "event_date", "date_precision", "note": { "es", "en" }, "sitelinks", "status", "rejection_reason" }]`
- `manifest.json`: `{ "dataset_version", "generated_at", "min_sitelinks", "counts": { … } }`

**Validación:** si hay menos de 500 `terms` `approved`, o menos de 100 `timeline_facts` `approved` en alguna categoría v1, el script termina con error y no escribe.

---

### Paso 3: Cargar en la base (`sync_banks`, al arrancar el generator)

**Origen:** generator
**Destino:** nerdose-db
**Tipo:** Interno

**Operación de BD:**
- `SELECT pg_try_advisory_lock(hashtext('sync_banks'))`
- **Tabla:** `job_runs` — INSERT (`job = 'sync_banks'`, `status = 'running'`)
- **Tabla:** `terms` — INSERT (`term`, `category`, `definition`, `summary`, `wikidata_id`, `sitelinks`, `status`, `rejection_reason`, `dataset_version`) ON CONFLICT (`wikidata_id`) DO UPDATE, con estas reglas:
  - si en la base está `rejected`, no cambia (trigger `bank_items_rejected_terminal`);
  - si en el dataset está `rejected`, pasa a `rejected` con `rejection_reason`;
  - si no, actualiza `term`, `category`, `definition`, `summary`, `sitelinks` y `dataset_version`;
  - nunca toca `last_used_devdle` ni `last_used_grep`.
- **Tabla:** `timeline_facts` — igual, con `label`, `category`, `event_date`, `date_precision`, `note`, `sitelinks` y `dataset_version`. Nunca toca `last_used`.
- Los ítems que están en la base y no en el dataset no se borran.

**Eventos de dominio:** `ContentItemApproved` / `ContentItemRejected`, solo en los logs.

---

### Paso 4: Registrar la carga

**Operación de BD:**
- **Tabla:** `job_runs` — UPDATE `status = 'success'`, `finished_at`, `summary = { dataset_version, inserted, updated, unchanged, kept_rejected }`

**Acción:** recién después se habilita el job `fill` (ver `generacion-diaria`). La `api` toma los `terms` nuevos para la lista válida de Devdle en el próximo cambio de día o reinicio.

**Ref:** `docs/db-schemas/nerdose-db.md` tablas `terms`, `timeline_facts`, `job_runs`; ADR-016

## Manejo de Errores

| Paso | Error | Código | Response | Comportamiento |
|------|-------|--------|----------|---------------|
| 1 | Wikidata o Wikipedia no responden o limitan | HTTP 429/5xx | — | El script reintenta con backoff; si sigue fallando, termina sin escribir (no afecta producción) |
| 2 | No llega a los mínimos | — | Error del script con los conteos | Se ajustan `min_sitelinks` o el mapeo de clases y se vuelve a correr |
| 3 | JSON del dataset inválido (schema Zod) | — | — | `sync_banks` falla, `job_runs.status = 'failed'`, el `generator` no arranca `fill` y loguea `error`. Los bancos en la base quedan como estaban |
| 3 | Otra instancia tiene el lock | — | — | Espera y reintenta; no corre dos cargas a la vez |

## Resultado

**Éxito:** los bancos de la base reflejan el dataset del repo, sin revivir ítems rechazados por anulaciones y sin perder el historial de uso.

**Estado final:**
- Terms / TimelineFacts: insertados o actualizados con el `dataset_version` del deploy.
- JobRun `sync_banks`: `success` con el resumen. Se ve en el stock del admin (`last_sync`).

## Notas

- Los bancos se reutilizan cuando vence su ventana anti-repetición (365 días Devdle, 30 Grep Grid, 90 Timeline). Con los mínimos del paso 2, no se agotan.
- La lista base de Devdle (`packages/games/devdle/wordlist/words.txt`) se genera con otro script offline (`build:wordlist`) y no pasa por la base.
- Los textos de Wikipedia son CC BY-SA: `packages/content/LICENSE-DATA.md` y la página "Acerca de" llevan la atribución.
