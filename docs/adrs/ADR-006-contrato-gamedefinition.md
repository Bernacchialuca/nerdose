# ADR-006: Contrato `GameDefinition` y juegos como paquetes enchufables

**Estado:** Accepted
**Fecha:** 2026-11-03
**Decisores:** Responsable de nerdose
**Etiquetas:** juegos, contrato, extensibilidad, anti-spoiler

## Contexto

nerdose tiene 5 juegos en v1 (Devdle, Grep Grid, Tech Timeline, Big O, Bug Hunt) y tiene que poder sumar más sin tocar la `api`, el shell ni las rachas (NFR-SC02). Cada juego tiene su propia jugada, su estado, su fin de partida, su criterio de victoria, su resultado, su share y sus stats propias.

Además, la solución nunca puede salir del servidor antes de terminar la partida (invariante 18, NFR-S01). Eso exige que la transformación "payload → lo que ve el cliente" esté definida y testeada por juego.

## Decisión

Cada juego es un paquete `packages/games/<game_id>` que implementa el contrato `GameDefinition` de `@nerdose/core`, con tres entradas:

```ts
// @nerdose/core — contrato de servidor (entrada ./definition de cada juego)
export interface GameDefinition<Payload, PublicView, State, Move, Feedback, Result, Stats> {
  id: GameId;                       // 'devdle' | 'grep-grid' | 'timeline' | 'big-o' | 'bug-hunt'
  version: number;                  // versión del schema de Payload
  moveSchema: z.ZodType<Move>;

  toPublic(p: Payload, locale: Locale, state?: State): PublicView;   // sin solución; state solo con la Play in_progress (REQ-005)
  initState(p: Payload, now: Date): State;
  applyMove(p: Payload, s: State, m: Move, now: Date, ctx: MoveContext):
    { state: State; feedback: Feedback } | { error: MoveError };   // 'invalid_move' | 'not_in_word_list'
  isFinished(s: State): boolean;
  result(p: Payload, s: State, locale: Locale): Result;      // incluye solución y explicación
  isWin(r: Result): boolean;
  score(r: Result): number;

  initialStats(): Stats;
  reduceStats(prev: Stats, r: Result): Stats;
  historyLabel(r: Result): string;  // "✓ 4/6", "8/8", "3/5", "✓ O(n log n)", "✗ L7"
}

// entrada ./generator
export interface MoveContext { isValidWord(word: string): boolean; locale: Locale }   // lo arma la api (WordList.has y el locale resuelto, REQ-005); los juegos que no lo usan lo ignoran

export interface GameGenerator<Payload> {
  historySpec: { bank: 'terms' | 'timeline_facts' | null; lastUsedField: string; recentDays: number };
  usedBankItems(p: Payload): string[];                       // ids del banco que consume el payload
  generate(input: { date: string; seed: Uint8Array; history: GeneratorHistory }): Payload;
  verify(p: Payload, history: GeneratorHistory): VerificationLog;   // { ok, checks[], reason? }
}
// GeneratorHistory = { bankItems (ítems approved con su last_used_*), recentChallenges (no rejected, [D - recentDays, D - 1]) }

// entrada ./client
//   Instructions, Game, Result (componentes React) y share(result, number): string
```

Hay un **registry** en `api`, en `web`/`admin` y en `generator` que mapea `game_id` → la entrada correspondiente. Las rutas de la `api` (`/api/games/{game_id}/today/*`) son genéricas sobre el registry.

## Reglas de Implementación

- Cada juego MUST vivir en `packages/games/<game_id>`, con `game_id` ∈ `devdle | grep-grid | timeline | big-o | bug-hunt`.
- La entrada `./definition` MUST exportar un objeto que implemente `GameDefinition` de `@nerdose/core`, con todos los métodos de la interfaz.
- Las rutas de juego de la `api` MUST resolver el juego por el registry. MUST NOT haber `if (game_id === '…')` ni `switch` por juego en `apps/api` ni en el shell de `apps/web`.
- La `api` MUST NOT serializar `challenges.payload` en ninguna respuesta de jugador. Antes de terminar la Play solo puede responder `toPublic(payload, locale, state?)`; después, `result(payload, state)`.
- La `api` MUST pasar `state` a `toPublic` solo si la Play está `in_progress` (sin Play o con la Play terminada, `undefined`). Con `state`, `toPublic` MAY revelar únicamente lo que el jugador ya descubrió en esa Play (Grep Grid: `words[].definition` de los `term_id` presentes en `found_words`); MUST NOT revelar nada de lo no descubierto (REQ-005).
- `Feedback` MUST ir en el locale del jugador (`ctx.locale`), nunca como `{ es, en }` (ADR-015).
- `toPublic` MUST NOT incluir: la palabra de Devdle, `placements` de Grep Grid, `correct_order`/`event_date`/`fact_id` de Timeline, `answer` de Big O, ni `bug_node_id`/`failing_test`/`fix`/`line_of`/`mutation` de Bug Hunt.
- Cada juego MUST tener un test de contrato anti-spoiler: se serializa `toPublic(payload)` (sin estado y con estados intermedios, si el juego usa `state`) y toda respuesta pre-resultado, y se verifica que no contienen ningún valor de la solución.
- `moveSchema` MUST usarse tanto en `web` (antes de enviar) como en la `api` (`@hono/zod-validator`). Si el parse falla, la respuesta es `422 invalid_move`.
- `share(result, number)` MUST NOT incluir la solución y MUST terminar en `nerdose.dev`.
- `generate` MUST ser determinista: el mismo `{ date, seed, history }` da el mismo `Payload`. MUST NOT usar `Math.random()` ni la hora actual.
- `Payload` MUST incluir todos los textos que lee el jugador como `{ es, en }`. `verify` MUST fallar si falta algún idioma.
- Sumar un juego MUST requerir solo crear su paquete y registrarlo en los tres registries, sin cambiar rutas, tablas ni lógica de rachas.

## Consecuencias

### Positivas
- Agregar un juego no toca la `api`, el shell ni las rachas.
- El anti-spoiler queda en un único punto por juego (`toPublic`/`result`), fácil de testear.
- El admin reutiliza los componentes `client` para la preview con la solución.

### Negativas
- El contrato genérico obliga a modelar juegos de una sola jugada (Big O, Bug Hunt, Timeline) con un `State` casi vacío.
- Cambiar la interfaz obliga a tocar los 5 paquetes.

### Riesgos
- **Riesgo:** un juego filtra la solución en `toPublic` o en el `Feedback`.
  - **Mitigación:** el test de contrato anti-spoiler obligatorio por juego (NFR-S01, NFR-S04).
- **Riesgo:** un cambio del generador altera desafíos ya generados.
  - **Mitigación:** se guarda el `payload` completo y el `generator_version`, y nunca se regenera desde el seed (invariante 2).

## Alternativas Consideradas

### Alternativa 1: Endpoints y tablas por juego

**Pros:**
- Cada juego con su propio modelo, sin abstracción.

**Contras:**
- Cinco APIs y cinco esquemas que mantener.
- Sumar un juego toca la `api`, el shell y las rachas.

**Por qué se descartó:** rompe NFR-SC02 y multiplica el trabajo de una sola persona.

## Referencias

- `docs/discovery/analisis-tecnico.md` — Componentes compartidos, F2, F3, Arq-5
- `docs/discovery/analisis-dominio.md` — Challenge (payload y vista pública por juego), Play (criterios por juego), Invariante 18
- `docs/ARCHITECTURE.md` — §6 Contrato de juegos
