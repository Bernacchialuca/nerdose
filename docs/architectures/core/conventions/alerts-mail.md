---
id: alerts-mail
display_name: Alertas por mail (notify)
language: node
description: Single notify() helper from @nerdose/core/notify over nodemailer with best-effort, once-only claim semantics
applies_to: [api, worker, library]
required_by: []
package: nodemailer
---

# Alerts by Mail (Node, nodemailer)

All alerts to the owner are plain-text mails sent through `notify(subject, text)` from `@nerdose/core/notify`, the Node-only entry of core (ADR-003, ADR-013), so nodemailer never reaches the `web`/`admin` bundles. Each service builds it once with `createNotify(env, logger)` so that core never reads `process.env`. Delivery is best-effort and "once per event": the event is claimed in the database first, the mail is sent after the commit, and a failed send releases the claim.

## When to use

- `api`: report threshold reached on a challenge.
- `generator`: tomorrow's challenge is missing after all attempts.
- Nothing else sends mail. There is no other notification channel in v1.

## Package

```
nodemailer          # runtime, used only inside @nerdose/core/notify
```

## Configuration

```ts
// packages/core/src/notify.ts
import nodemailer from 'nodemailer';

export type SmtpConfig = {
  SMTP_HOST?: string; SMTP_PORT?: number; SMTP_USER?: string; SMTP_PASS?: string;
  ALERT_EMAIL_FROM?: string; ALERT_EMAIL_TO?: string;
};

// Built once per service from the validated `env` object (core never reads process.env).
export function createNotify(cfg: SmtpConfig, log: Logger) {
  return async function notify(subject: string, text: string): Promise<boolean> {
    if (!cfg.SMTP_HOST || !cfg.ALERT_EMAIL_FROM || !cfg.ALERT_EMAIL_TO) {
      log.warn({ subject }, 'Alert not sent: SMTP not configured');
      return false;
    }
    const port = cfg.SMTP_PORT ?? 587;
    const transport = nodemailer.createTransport({
      host: cfg.SMTP_HOST, port, secure: port === 465,
      auth: cfg.SMTP_USER ? { user: cfg.SMTP_USER, pass: cfg.SMTP_PASS } : undefined,
    });
    try {
      await transport.sendMail({ from: cfg.ALERT_EMAIL_FROM, to: cfg.ALERT_EMAIL_TO, subject, text });
      return true;
    } catch (err) {
      log.error({ err, subject }, 'Alert delivery failed');
      return false;
    }
  };
}
```

## How to use

### Claim, commit, send, release

```ts
// apps/api/src/domain/quality/quality.service.ts
const claimed = await db.transaction(async (tx) => {
  const [row] = await tx.execute(sql`
    UPDATE challenges SET alert_sent_at = now()
    WHERE id = ${challengeId} AND alert_sent_at IS NULL RETURNING id`);
  return Boolean(row);
});                                                    // COMMIT happens here

if (claimed) {
  const sent = await notify(subject, body);       // after the commit
  if (!sent) await repo.releaseAlert(challengeId);     // UPDATE ... SET alert_sent_at = NULL
}
```

The generator does the same over `generation_failures.alert_sent_at`.

### Mail contents

| Alert | Subject | Body |
|---|---|---|
| Reports | `[nerdose] Desafío #{number} {game_id}: {n} reportes` | `challenge_id`, `date`, count per `reason`, link `https://admin.nerdose.dev` |
| Generation failure | `[nerdose] Sin desafío de {game_id} para {date}` | `attempts` and the last rejection reason |

## Rules

- Every alert goes through `notify()` of `@nerdose/core/notify`. Frontends MUST NOT import that entry. Never call nodemailer from routes or jobs.
- If `SMTP_*` or `ALERT_EMAIL_*` are missing, `notify()` logs at `warn`, returns `false` and the process starts normally.
- The claim is an `UPDATE ... WHERE alert_sent_at IS NULL RETURNING` inside the event transaction; the send happens after `COMMIT`.
- If `notify()` returns `false` or throws, set `alert_sent_at = NULL` on the same row so the next event retries.
- A delivery failure never changes the HTTP response of a report (`201`) and never fails a job run.
- Mails are plain text. Subjects and bodies follow the table above.
- The report threshold reads `REPORT_ALERT_COUNT` (3), `REPORT_ALERT_RATIO` (0.05) and `REPORT_ALERT_RATIO_MIN_COUNT` (2); only `wrong_answer` and `ambiguous` reports count.
- Alerts never void or unpublish anything.
- Mail bodies never contain player identifiers, cookies or tokens.

## Integration with other conventions

- **env-config**: validates the `SMTP_*`, `ALERT_EMAIL_*` and threshold variables.
- **logging**: unsent alerts are logged at `warn`/`error`.
- **error-handling**: delivery failures are logged, never raised to the client.
- **orm**: the claim and release are plain repository methods.
