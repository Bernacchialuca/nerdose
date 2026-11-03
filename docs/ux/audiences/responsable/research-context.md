---
document: UX Research Context
audience: responsable
version: "1.0"
date: 2026-11-03
status: hipótesis-preliminar
---

# UX Research Context — responsable

> Caracterización de la audiencia. **Todo lo que sigue es hipótesis** hasta
> que se valide con usuarios reales. Cada item está trazado a su fuente
> (PRD, benchmark, input-cliente). Items sin fuente trazable no se incluyen.

## Persona Genérica

- **Rol:** Responsable de la plataforma: la única persona que opera nerdose desde el admin (U-02). No carga ni aprueba contenido. `[fuente: PRD goals-and-context - Usuarios U-02]`
- **Contexto de uso:** Entra de forma esporádica a `admin.nerdose.dev`, tras una alerta por mail o para una revisión de rutina de reportes, próximos desafíos, stock y métricas. Sesión de 8 horas con una sola contraseña. `[fuente: PRD §F-10 C-37, F-11 C-38]`
- **Expertise técnico:** Alto. Es quien desarrolla y opera la plataforma (equipo de una sola persona). `[fuente: PRD goals-and-context - Restricciones: Equipo]`
- **Frecuencia de uso esperada:** Esporádica. No hay frecuencia relevada; se infiere que la mayoría de los días no necesita intervenir porque el contenido es automático. `[fuente: PRD F-14, historia de usuario]`
- **Dispositivo principal:** Desktop (único): tablas y previews ES/EN en paralelo. No hay caso de uso mobile relevado. `[fuente: product-overview - Superficie admin]`

## Jobs To Be Done

1. **Cuando** me llega una alerta por reportes o reviso los reportes abiertos, **quiero** ver por desafío la solución, los textos ES/EN y los motivos, y poder anularlo si el error está confirmado, **para** que un error del generador no afecte las rachas de los jugadores.
   `[fuente: PRD §F-11 - Historia de usuario, C-39, C-41]`

2. **Cuando** quiero anticipar problemas sin cargar nada a mano, **quiero** mirar los próximos 14 días y el stock de contenido de los bancos, y regenerar un desafío si hace falta, **para** detectar un hueco o un desafío dudoso antes de su fecha.
   `[fuente: PRD §F-12 - Historia de usuario, C-43, C-44, C-45]`

3. **Cuando** quiero saber si la plataforma se usa y si los desafíos funcionan, **quiero** consultar las métricas de uso, retención y calidad por desafío, **para** decidir si hay algo que revisar.
   `[fuente: PRD §F-13 - Historia de usuario, C-46]`

## Pains

- Sin una vista que reúna solución, ES/EN, motivos y contexto en un mismo lugar, no puede decidir si anular y tiene que reconstruir la información desde otras fuentes. `[fuente: benchmark - Modqueue de Reddit, a evitar]`
- Anular un desafío tiene efectos en cascada (Play, reportes, Term, agregados) que no se pueden deshacer; si no se ven antes de confirmar, corre el riesgo de ejecutar una anulación con consecuencias no previstas. `[fuente: benchmark - Django admin, a evitar; PRD §F-11 C-41]`
- Si la generación falla o el stock se agota, no tiene forma de saberlo sin revisar manualmente cada juego y día, y la plataforma tolera cero días sin desafío. `[fuente: PRD goals-and-context - Métricas de éxito; PRD §F-14 C-49]`

## Gains

- Resuelve un grupo de reportes en una sola pantalla: ve el desafío completo, decide y cierra con resolver, descartar o anular. `[fuente: PRD §F-11 C-39, C-40, C-41]`
- Confirma de un vistazo que hay desafíos aprobados para los próximos 14 días en cada juego, y qué días quedan sin desafío. `[fuente: PRD §F-12 C-43]`
- Consulta cifras resumen de un rango de fechas elegido, con el detalle por desafío debajo. `[fuente: benchmark - Plausible Analytics; PRD §F-13 C-46]`

## Hipótesis de Comportamiento

- Abre la sección de reportes esperando ver solo lo abierto, como una cola de pendientes. `[estado: hipótesis | fuerza: inferida-PRD]`
- Entra al admin principalmente después de recibir la alerta por mail (umbral de reportes o falla de generación), y no por rutina diaria. `[estado: hipótesis | fuerza: inferida-PRD]`
- Espera un paso de confirmación que muestre las consecuencias antes de anular un desafío. `[estado: hipótesis | fuerza: inferida-benchmark]`
- Espera elegir un rango de fechas y ver cifras resumen antes del detalle en Métricas. `[estado: hipótesis | fuerza: inferida-benchmark]`
- Prefiere tablas simples a gráficos para las métricas. `[estado: hipótesis | fuerza: por-analogía]`

## Restricciones de Contexto

- **Uso esporádico** — Entre visitas olvida detalles de la interfaz; las etiquetas y estados deben ser consistentes entre secciones. `[fuente: PRD F-14; benchmark - anti-patrón de señales inconsistentes]`
- **Sesión de 8 horas y contraseña única** — Un token vencido devuelve al login. `[fuente: PRD NFR-S07, C-38]`
- **Interfaz solo en español** — El contenido a revisar sí es bilingüe (ES y EN lado a lado). `[fuente: product-overview - Superficie admin]`

## Lo que NO Sabemos

- ¿Con qué frecuencia real entra el responsable y qué lo hace entrar: la alerta por mail, una rutina o la curiosidad por las métricas? Hoy es un supuesto.
- ¿Qué información usa realmente para decidir si un reporte es un error confirmado: la solución, el log de verificación, el contexto del jugador u otra fuente externa?
- ¿Cuál de los tres JTBD es el más frecuente y cuál el más crítico? No hay orden de prioridad relevado.
- ¿Qué herramientas usa hoy para operar (base de datos directa, logs, otros paneles) y qué esperaría encontrar en el admin que ya conoce de ellas?
- ¿Son cómodas las tablas simples para las métricas o necesita gráficos de evolución? Metabase y otros paneles no se investigaron.
- ¿Usa el admin desde el teléfono ante una alerta? El PRD no relevó un caso mobile.

---

**Estado:** Documento en estado `hipótesis-preliminar`. Para promoverlo a `validado`, ejecutar entrevistas reales y actualizar in-place el estado de cada hipótesis.

**Consumido por:** Los `product-map.md` y `user-flows.md` de las superficies que esta audiencia usa (ver matriz en `product-overview.md`).
