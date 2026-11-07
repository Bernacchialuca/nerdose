# Licencias de los datos

Los archivos de `data/` se generan automáticamente con `pnpm --filter @nerdose/content import:banks` a partir de Wikidata y Wikipedia. Los cambios respecto de la fuente son una extracción automática: selección de campos, normalización del término y filtrado por reglas.

## Wikidata (CC0 1.0)

Los textos de `definition` derivan de las descripciones de Wikidata, junto con `wikidata_id`, el nombre del término y `sitelinks`. Los datos estructurados de Wikidata se publican bajo [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/).

## Wikipedia (CC BY-SA 4.0)

Los textos de `summary` derivan del primer párrafo (`extract`) de los artículos de Wikipedia en español (`es.wikipedia.org`) e inglés (`en.wikipedia.org`), obtenidos con la API REST `page/summary`. Se redistribuyen bajo [Creative Commons Atribución-CompartirIgual 4.0 (CC BY-SA 4.0)](https://creativecommons.org/licenses/by-sa/4.0/). La atribución corresponde a los autores de cada artículo, cuyo historial está en la página de Wikipedia del término; cada ítem se identifica con su `wikidata_id`.

Cualquier obra derivada de los textos de `summary` debe conservar esta licencia y esta atribución.
