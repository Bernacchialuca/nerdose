# content — Overview

## Proposito
Paquete `@nerdose/content` (`packages/content`): dataset versionado de los bancos `terms` y `timeline_facts` (`data/terms.json`, `data/timeline_facts.json`, `data/manifest.json`) y el script offline `import:banks`, que consulta Wikidata y Wikipedia solo en desarrollo (ADR-016). Incluye `loadDataset()` (valida con Zod, sin red) y `LICENSE-DATA.md`. La lista base de Devdle (`build:wordlist`, `wordlist/words.txt`) vive en el paquete `devdle`, con el mismo criterio offline.

## Tipo de servicio
Library en node (TypeScript). Ningún servicio desplegado consulta Wikimedia: el `generator` carga el dataset con `sync_banks` al arrancar.

## Modulos del dominio
- **dataset**: archivos de datos, schemas y `loadDataset()`.
- **import-script**: `import:banks` y sus reglas de aceptación y mínimos.

## Notas adicionales
- **Convenciones:** `content-sync` copiada tal cual de `generator` (con `library` en `applies_to`); `dataset-format` es propia y sale de ADR-016.
- **Idioma de las convenciones:** siguen el template del workflow (contenido y encabezados en inglés, `display_name` en español); `overview.md` e `index.md` van en español.

---

**Manifest:** [manifest.yaml](./manifest.yaml)
**Indice de arquitectura:** [index.md](./index.md)
