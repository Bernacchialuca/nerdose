---
document: UX Benchmark
audience: responsable
version: "1.0"
date: 2026-11-03
status: Hipótesis inicial - Referencias de partida
---

# UX Benchmark — responsable

> Referentes mentales que esta audiencia trae al producto. Productos que
> ya usa o conoce, y de los que importa expectativas. No es auditoría
> exhaustiva — es punto de partida para entender qué patrones ya conoce
> el usuario y qué espera encontrar.

## Competidores Directos

No hay competidores directos en sentido estricto: el admin de nerdose es una herramienta interna de una sola persona (PRD, goals-and-context: U-02). Las referencias más cercanas son flujos de revisión de reportes y paneles de operación; se listan abajo como referencias directas por tarea.

### Modqueue de Reddit (revisión de reportes)

- **Qué resuelve:** Cola central de ítems pendientes de revisión por moderadores, que reúne reportes de usuarios y filtros automáticos.
- **Cómo lo resuelve:** Lista única de pendientes; sobre cada ítem el moderador puede aprobar, remover, marcar como spam o ignorar reportes futuros, y puede actuar sobre varios ítems a la vez (guía comunitaria r/ukmods, 2020). Según la investigación académica, algunos moderadores la usan como checklist diario y otros para detectar patrones de la comunidad.
- **A tomar:** Una sola cola de pendientes con acciones de cierre explícitas por ítem (equivale a "resolver" / "descartar", C-40). Hipótesis a validar: que el responsable espere abrir la sección y ver solo lo abierto (C-39 ya lo define por defecto `open`).
- **A evitar:** Los moderadores reportan que la cola no da suficiente información para decidir y que las señales de la interfaz son inconsistentes. En nerdose, cada grupo debería mostrar en el mismo lugar solución, ES/EN, motivos y contexto (C-39).
- **Fuente:** [Reddit Modqueue — arXiv 2509.07314](https://arxiv.org/abs/2509.07314v1) (resumen leído, noviembre 2026); [Modeling the Modqueue — arXiv 2409.16840](https://arxiv.org/html/2409.16840v1) (solo resultado de búsqueda); [r/ukmods, guía de mod queue](https://redlib.belloworld.it/r/ukmods/comments/iibj7p/what_is_the_mod_queue) (solo vía resumen de búsqueda, 2020).

### Django admin (back-office de contenido)

- **Qué resuelve:** Back-office genérico para listar, filtrar y operar sobre registros, usado como panel interno por equipos chicos.
- **Cómo lo resuelve:** Lista de registros donde se seleccionan filas y se aplica una acción sobre ellas; las acciones pueden redirigir a una página intermedia para pedir confirmación (el borrado integrado lo hace así) y muestran mensajes de éxito o error con `message_user()`. Se puede restringir una acción por permisos.
- **A tomar:** Acción destructiva con paso de confirmación y mensaje de resultado visible. Aplica a la anulación de un desafío (C-41), que es irreversible y afecta a todas las Play del día.
- **A evitar:** Dato observado en la documentación: el borrado en lote no invoca el `delete()` de cada modelo (efectos secundarios no ocurren). Para nerdose, equivalente a riesgo: la anulación tiene efectos en cascada (Play, reportes, Term, agregados), que el admin debe explicitar antes de confirmar. Hipótesis a validar.
- **Fuente:** [Django: Admin actions](https://docs.djangoproject.com/en/stable/ref/contrib/admin/actions/) (leído en esta sesión, noviembre 2026).

## Referentes Indirectos

### Plausible Analytics (categoría: analítica web)

- **Qué expectativa trae a este producto:** Métricas con selector de período y totales arriba, con desglose por dimensión debajo. nerdose lo integra además como analítica web opcional (decisión #30), por lo que el responsable lo conocerá.
- **Cómo se manifiesta:** Hipótesis: el responsable espera elegir un rango de fechas (C-46: `from`/`to`) y ver cifras resumen antes del detalle. Plausible, según su guía oficial, usa un selector de fechas que define el período y cifras principales (visitantes únicos, visitas, páginas vistas, rebote, duración).
- **Fuente:** [Plausible: Introduction to the dashboard](https://docs.plausible.io/guided-tour) (resultado de búsqueda, noviembre 2026).

## Patrones Recurrentes

- **Cola de pendientes con acciones de cierre por ítem** — Modqueue de Reddit y el modelo de acciones del Django admin: se revisa una lista y cada ítem se cierra con una acción explícita.
- **Acciones destructivas con confirmación y mensaje de resultado** — Django admin (confirmación en la acción de borrado, mensajes tras ejecutar). Es convención de back-offices.
- **Selector de período + cifras resumen sobre el detalle** — Plausible. Aplica a la sección Métricas (F-13).

## Diferenciadores

- **Contexto completo del desafío en el lugar de la decisión** — La modqueue de Reddit tiene quejas documentadas por falta de información para decidir. El admin de nerdose puede mostrar, junto a los reportes, la solución, ES/EN y la verificación del desafío (C-39, C-43). Oportunidad, no decisión.
- **Sin carga de contenido** — Ningún back-office de contenido de la lista omite la edición manual; acá el responsable solo observa, anula o regenera (PRD, goals G-04). El admin puede ser más simple que un CMS. Hipótesis a validar.
- **Una sola persona, sin coordinación** — Los problemas de coordinación entre moderadores documentados para Reddit no aplican; el flujo no necesita asignación ni estados intermedios (admin sin roles, fuera de alcance v1).

## Anti-patrones Detectados

- **Señales de interfaz inconsistentes en la cola de revisión** — Reportado para la modqueue de Reddit en la investigación (arXiv 2509.07314). Evitar estados o etiquetas distintos para la misma cosa entre reportes, próximos desafíos y métricas.
- **Efectos laterales no visibles en acciones en lote** — Django: el borrado en lote omite el `delete()` por modelo. Evitar anular sin mostrar de antemano las consecuencias.

## Limitaciones del Benchmark

- **Reddit Modqueue (UI actual):** Solo se verificó el resumen del paper de 2025 y fuentes comunitarias de 2020-2023 vía búsqueda. No se pudo acceder a la ayuda oficial de Reddit ni al producto; los nombres de botones y el orden de la cola pueden haber cambiado y no se describen.
- **Django admin (changelist, filtros):** La búsqueda de `list_display`/`list_filter` no devolvió la documentación oficial; solo se verificó la página de acciones. Los filtros no se usan como referencia.
- **Plausible:** Se verificó solo el resumen de su guía oficial (vía búsqueda); no se probó el producto ni la sección de definiciones de métricas. No se verificó nada de su administración self-hosted.
- **Metabase y otros paneles de métricas con tablas:** No se investigaron. Qué tan cómodas son las tablas HTML simples para el responsable queda por validar.
- **Uso real del responsable:** Esta audiencia es el propio dueño del proyecto (U-02); sus referentes reales no se relevaron. A validar con él.

---

**Próximo artefacto:** Este benchmark alimenta `research-context.md` de la misma audiencia con material concreto para inferir pains, gains y JTBDs.
