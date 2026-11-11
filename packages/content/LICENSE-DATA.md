# Licencias de los datos

Los archivos de `data/` se generan automáticamente con `pnpm --filter @nerdose/content import:banks` a partir de Wikidata y Wikipedia. Los cambios respecto de la fuente son una extracción automática: selección de campos, normalización del término y filtrado por reglas.

## Wikidata (CC0 1.0)

Los textos de `definition` derivan de las descripciones de Wikidata, junto con `wikidata_id`, el nombre del término y `sitelinks`. Los datos estructurados de Wikidata se publican bajo [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

En `timeline_facts.json`, `label` (etiqueta en inglés), `event_date`, `date_precision` y `sitelinks` también provienen de Wikidata (CC0), igual que `note` cuando se toma de la descripción corta de Wikidata en lugar de Wikipedia.

## Wikipedia (CC BY-SA 4.0)

Los textos de `summary` derivan del primer párrafo (`extract`) de los artículos de Wikipedia en español (`es.wikipedia.org`) e inglés (`en.wikipedia.org`), obtenidos con la API REST `page/summary`. Se redistribuyen bajo [Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/). La atribución corresponde a los autores de cada artículo, cuyo historial está en la página de Wikipedia del término; cada ítem se identifica con su `wikidata_id`.

En `timeline_facts.json`, `note` deriva de la primera oración del `extract` del artículo de Wikipedia (es y en) y se redistribuye bajo la misma licencia CC BY-SA 4.0, con la misma atribución (el `wikidata_id` identifica el artículo). Cuando esa oración menciona un año distinto de `event_date`, `note` toma en su lugar la descripción de Wikidata (CC0).

Cualquier obra derivada de los textos de `summary` o de `note` debe conservar esta licencia y esta atribución.
