---
id: generation-queue
display_name: Cola de regeneracion en PostgreSQL
language: node
description: Regeneration requests as a PostgreSQL queue using LISTEN generation_requests, FOR UPDATE SKIP LOCKED and a 60 s backup poll
applies_to: [worker]
required_by: []
package: postgres
---

# Generation Queue (Node, postgres.js)

The only message between `api` and `generator` is the regeneration request (ADR-005). The `api` inserts a row in `generation_requests` and fires `pg_notify`; the `generator` listens on the channel, takes requests with `FOR UPDATE SKIP LOCKED` and polls every 60 seconds as backup. No Redis, BullMQ or HTTP between the services.

## When to use

- The `generator` handling of `generation_requests` (admin "regenerate challenge").
- Any new asynchronous request from `api` to `generator` must follow this pattern.

## Package

```
postgres      # postgres.js: sql.listen() for LISTEN, dedicated connection
```

## Structure

```
apps/generator/src/domain/challenge-publishing/
├── queue/
│   ├── queue-listener.ts       # LISTEN + 60 s poll + reconnection
│   └── process-request.ts      # take, generate, replace, mark done/failed
└── challenge-publishing.repository.ts
```

## Configuration

```ts
// apps/generator/src/domain/challenge-publishing/queue/queue-listener.ts
export async function startQueueListener(deps: Deps) {
  const drain = () => drainPending(deps);                         // process all pending requests
  const listener = await deps.sql.listen('generation_requests', () => void drain(),
    () => deps.logger.info('LISTEN (re)connected'));              // postgres.js reconnects and re-listens
  const poll = setInterval(() => void drain(), 60_000);           // backup for lost NOTIFY
  await drain();                                                  // requests that arrived while down
  return { stop: async () => { clearInterval(poll); await listener.unlisten(); } };
}
```

```ts
// take one request
const [req] = await tx.execute(sql`
  SELECT id, challenge_id FROM generation_requests
  WHERE status = 'pending'
  ORDER BY requested_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1`);
```

## How to use

### Processing a request

```ts
await db.transaction(async (tx) => {
  const req = await takePending(tx);                      // FOR UPDATE SKIP LOCKED
  if (!req) return;
  const old = await challenges.get(tx, req.challenge_id);
  const fresh = await generateAndVerify(old.game_id, old.date, deps); // may take long: see note
  if (fresh) {
    await challenges.reject(tx, old.id, { reason: 'regenerated' });   // old -> rejected
    await challenges.approve(tx, fresh.id);                            // new -> approved
    await requests.done(tx, req.id, fresh.id);                         // status done + new_challenge_id
  } else {
    await requests.failed(tx, req.id, 'verification failed after retries'); // old stays approved
  }
});
```

The request row stays locked (`FOR UPDATE SKIP LOCKED`) while the candidate is generated and verified. The old challenge is only touched at the end, by the swap old->new, and stays `approved` until the new one is verified. Writes of the swap, of the request and of `processed_at` commit together.

### The `api` side (for reference)

The `api` inserts the row (only one `pending` per challenge) and runs `SELECT pg_notify('generation_requests', <request_id>)`; it never waits for the result. The admin polls `GET /api/admin/challenges/upcoming`.

## Rules

- `api` and `generator` communicate only through tables of `nerdose-db`. No HTTP, sockets or files.
- The channel is exactly `generation_requests`; the NOTIFY payload is only the `request_id` (uuid). The data is read from the table.
- The `generator` takes requests with `FOR UPDATE SKIP LOCKED` and polls every 60 s as backup; on startup it drains pending requests.
- `LISTEN` uses a dedicated persistent connection and reconnects on error; the poll covers any lost notification.
- The old->new replacement happens in a single transaction: old `rejected` (`verification.reason = 'regenerated'`), new `approved`, request `done` with `new_challenge_id`. The old challenge stays `approved` until the new one is verified.
- If generation fails after the retries, the request becomes `failed` with `error` and the old challenge stays `approved`.
- `generation_requests.status` is one of `pending | done | failed`.
- Requests for a challenge that is no longer `approved` or whose `date <= today` are marked `failed` without generating.
- The `generator` never answers the `api` directly; the admin sees the result by reading the tables.
- A failure processing one request does not stop the loop: it is logged and the request is marked `failed`.

## Integration with other conventions

- **scheduler-jobs**: starts and stops the listener, shares shutdown.
- **challenge-generation**: `generateAndVerify` is the same pipeline used by `fill`.
- **orm**: raw SQL for `LISTEN`, `SKIP LOCKED`; the rest through repositories.
- **testing**: tests use a second connection and await the row state; no sleeps.
