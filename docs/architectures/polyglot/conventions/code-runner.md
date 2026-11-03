---
id: code-runner
display_name: Ejecucion de snippets (execFile + polyglot)
language: node
description: Multi-language snippet runner using child_process.execFile with a 10 s timeout and non-root user, provided by @nerdose/polyglot
applies_to: [worker, library]
required_by: []
package: "@nerdose/polyglot"
---

# Code Runner (Node, execFile)

Big O and Bug Hunt are verified by compiling and running the emitted code in JavaScript, Go and Java (ADR-007). The runner lives in `@nerdose/polyglot` and uses `child_process.execFile` with a timeout and a non-root user. Only the `generator` may import it: the `api` never executes code.

## When to use

- `verify()` of games whose payload contains code (`big-o`, `bug-hunt`).
- Any other check that needs to run a toolchain (compile check of emitted code).

## Package

```
@nerdose/polyglot       # code tree, JS/Go/Java emitters, runner (internal)
node:child_process      # execFile (built in)
```

Toolchains in the environment: Node 24, Go >= 1.25, JDK 21 (Java in source-file mode, `java Main.java`).

## Structure

```
packages/polyglot/src/
├── tree/            # language-neutral code tree
├── emit/            # js.ts, go.ts, java.ts
└── runner/
    └── run.ts       # runInLanguage(lang, source, inputs)
```

## Configuration

```ts
// packages/polyglot/src/runner/run.ts
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
const execFileAsync = promisify(execFile);

const COMMANDS = {
  js:   (dir: string) => ['node', [`${dir}/main.js`]],
  go:   (dir: string) => ['go', ['run', `${dir}/main.go`]],
  java: (dir: string) => ['java', [`${dir}/Main.java`]],       // source-file mode
} as const;

export async function runInLanguage(lang: 'js' | 'go' | 'java', dir: string) {
  const [cmd, args] = COMMANDS[lang](dir);
  const { stdout } = await execFileAsync(cmd, args as string[], {
    timeout: 10_000, uid: NON_ROOT_UID, gid: NON_ROOT_GID, maxBuffer: 1024 * 1024,
  });
  return stdout;
}
```

## How to use

- One `main` per variant and language runs **all** the inputs and prints the outputs, so one process verifies every case.
- The code is written to a temporary directory per run and removed afterwards.
- `verify()` compares outputs across languages and against the expected values and records the result in the `VerificationLog`.

```ts
const outputs = await Promise.all(['js', 'go', 'java'].map((l) => runInLanguage(l, dir)));
checks.push({ name: 'same_output_all_languages', ok: outputs.every((o) => o === outputs[0]) });
```

## Rules

- The runner uses `execFile` (never `exec` with a shell), with timeout 10 000 ms, and runs as a non-root user.
- Arguments are never built from untrusted strings; code goes in files, not in the command line.
- A timeout, a non-zero exit or a compile error is a failed check (candidate `rejected`), not an exception that stops the job.
- Only the `generator` imports `@nerdose/polyglot`. `./definition` and `./client` entries of games never import it, nor `node:child_process`.
- Required toolchains: Node 24, Go >= 1.25, JDK 21. Versions are not silently substituted.
- The runner makes no network calls; network isolation and resource limits are defined with the hosting (deferred).
- Temporary directories are unique per run and cleaned in a `finally`.
- Output size is bounded (`maxBuffer`).

## Integration with other conventions

- **challenge-generation**: `verify()` calls the runner.
- **logging**: log language, duration and exit status at `debug`; never the full source at `info`.
- **testing**: tests that run toolchains are integration tests and require them installed; a CI job compiles the emitted code.
