---
date: 2026-11-11
type: technical-change
service: content, core, db, games, api, generator, web
---

# Cambio Técnico: content, core, db, games — Tech Timeline mezcla categorías

## Requerimiento Original

> Cuatro cambios de producto sobre Tech Timeline (REQ-006), aprobados después de cerrar el request:
> 1. Cada desafío toma 5 hechos `approved` al azar (con el seed) de todo el banco, sin importar la categoría. Consigna única y fija. El Challenge deja de tener `category` propia; cada item conserva la de su hecho. Las stats propias se acumulan por hito.
> 2. `import:banks` falla si el total de hechos `approved` es menor que 450 (5 por día × 90 días de ventana).
> 3. Se elimina el mínimo de 100 `approved` por categoría; `hardware` vuelve a entrar.
> 4. Dos categorías nuevas: `databases` y `software_tools`.

## Resumen

El desafío de Tech Timeline deja de ser «de una categoría»: el generador elige 5 hechos distinguibles de todo el banco elegible (ventana de 90 días, distinguibilidad, `opaque_id` aleatorios, orden inicial ≠ correcto y verificación se mantienen). La consigna es única: «Ordená estos hitos del más antiguo al más reciente» / «Order these milestones from oldest to newest». La categoría pasa del Challenge a cada item (payload, vista pública y resultado) y el cliente la muestra como etiqueta `// <categoría>` en cada fila de la partida y en el riel del resultado; no revela la fecha, así que no rompe el anti-spoiler.

`PlayerGameStats.extra.by_category { played, correct }` se acumula por hito: cada uno de los 5 items suma `played += 1` a la categoría de su hecho y `correct += 1` si quedó en su lugar. «Mejor categoría» = mayor `correct / played`.

El importador ya no exige 100 `approved` por categoría: exige 450 en total (`MIN_APPROVED_TIMELINE_TOTAL = TIMELINE_FACTS_PER_CHALLENGE × TIMELINE_REUSE_WINDOW_DAYS`). El manifiesto reemplaza `parameters.timeline.min_approved_per_category` por `min_approved_total`. Se mantiene el mínimo de 3 categorías v1. El mínimo de 500 `terms` de Devdle/Grep Grid no cambia (no comparte código con el de hechos).

## Decisiones

- **Check de verificación:** `same_category` se reemplaza por `item_category` (cada item tiene una categoría válida e igual a la de su hecho en el banco), en la misma posición del log de verificación.
- **Banco con menos de 5 hechos:** `generate` lanza `RangeError('timeline generate: the bank has fewer than 5 facts')` (antes: «no category has 5 facts»).
- **Stats existentes:** los `extra.by_category` acumulados con la regla anterior (por partida) solo existen en bases de desarrollo local; no se migran. Se resetean con la base local.
- **Clases de `hardware`:** `computer hardware` (Q3966) traía sistemas de archivos y software (ext4, Samba, PDFCreator). Se reemplaza por los modelos de computadora (Q55990535), de consola (Q56682555) y de smartphone (Q19723451), con `P577` y fallback `P571`.
- **Clases nuevas:** `databases` = DBMS (Q176165), DBMS relacional (Q3932296) y NoSQL (Q82231); `software_tools` = navegador (Q6368), editor de texto (Q131212), editor de código (Q522972), IDE (Q13741), control de versiones (Q3257930), runtime de contenedores (Q7935198) y orquestador de contenedores (Q118218718). Ambas con `P571` y fallback `P577` (`TimelineClass.fallbackProperty` acepta ahora cualquiera de las dos propiedades).
- **`min_sitelinks_timeline`:** se mantiene en 16 (el calibrado en la primera corrida). El script sugiere 36 como el valor más alto que mantiene ≥ 450 en total.

## Dataset regenerado

`2026.11.11-2`: 1480 hechos `approved` (2079 `rejected`). Por categoría: `programming_languages` 184, `frameworks` 102, `companies` 382, `operating_systems` 235, `hardware` 164, `video_games` 314, `databases` 19, `software_tools` 80.

## Documentos Modificados

| Documento | Cambio |
|-----------|--------|
| `docs/prd/requirements.md` | Payload/vista pública de timeline, `extra` por hito, enum de `TimelineFact.category`, notas de categorías v1, C-24, C-25 y C-51 |
| `docs/prd/architecture.md` | Mínimo de 450 hechos en total |
| `docs/requests/REQ-006.tech-timeline.md` | Supuestos y requerimientos actualizados (marcados «Actualización 2026-11-11»); CA 5: el orden inverso da 1/5 |
| `docs/stories/S-025`, `S-027`, `S-029` | `status: Completed` |
| `docs/stories/S-027`, `S-028` | CA-3: el orden inverso da 1/5 |
| `docs/adrs/ADR-016-bancos-como-dataset-versionado.md` | Mínimo total de 450 hechos en lugar de 100 por categoría |
| `docs/apis/api.yaml` | `TimelineCategory` con 8 valores; `TimelinePublicView` y `TimelineResult` sin `category` propia y con `category` por item; ejemplos; `extra` por hito; `cycle_ok` |
| `docs/db-schemas/nerdose-db.md` | Enum `timeline_category` con `databases` y `software_tools`; nota de `extra`; índice de elección |
| `docs/flows/carga-de-bancos.md`, `docs/flows/generacion-diaria.md` | Mínimo total; selección sin categoría |
| `docs/architectures/content/conventions/dataset-format.md` | Mínimo total, `min_approved_total`, categorías v1 y conteos del dataset |
| `docs/ux/surfaces/web/screens/timeline-*.md`, `product-map.md`, `user-flows.md`, `screens.json`, `wireframes.html` | Sin categoría del día; etiqueta de categoría por hito; consigna única; texto del paso 1 de las instrucciones |
| `docs/reusable-code/{core,content,games}/*` | `PROMPT`, `chooseFacts`, `CategoryTag`, `item_category`, 8 categorías, firmas del importador |
| `docs/ARCHITECTURE.md` | Selección sin categoría y stat por hito |

## Código

- `core`: `TIMELINE_CATEGORIES` suma `databases` y `software_tools` (al final, para que el enum de PostgreSQL se pueda ampliar con `ADD VALUE`).
- `db`: migración `0005_timeline_categories_databases_software_tools`.
- `content`: `MIN_APPROVED_TIMELINE_TOTAL`, `assertTimelineMinimums` por total, `highestMinSitelinksTimeline` por total, `TIMELINE_CLASSES` con `hardware`, `databases` y `software_tools`; manifiesto con `min_approved_total`; dataset regenerado.
- `games/timeline`: schemas, `toPublic`, `result`, `reduceStats` por hito, `PROMPT` único, `chooseFacts` sin categoría, check `item_category`, `CategoryTag` en filas y riel, i18n ES/EN de las categorías nuevas.
- `api`, `generator`, `web`: fixtures y tests de integración alineados.
