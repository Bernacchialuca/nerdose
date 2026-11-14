---
id: code-runner
display_name: Ejecucion de snippets (execFile + polyglot)
language: node
description: Multi-language snippet runner using child_process.execFile with a 10 s timeout and non-root user, provided by @nerdose/polyglot
applies_to: [worker]
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
├── config/env.ts        # readRunnerEnv: the only place that reads RUNNER_UID / RUNNER_GID
└── runner/
    ├── outcome.ts       # RunOutcome, RunFailureKind, classifyFailure
    ├── child-env.ts     # buildChildEnv
    ├── run-as.ts        # resolveRunAs
    ├── exec.ts          # execFile as a promise that never rejects
    ├── toolchains.ts    # checkToolchains, parse*
    └── run.ts           # runInLanguage
```

## Configuration

```ts
type RunOutcome =
  | { ok: true; stdout: string; durationMs: number }
  | { ok: false; kind: 'timeout' | 'compile_error' | 'runtime_error' | 'toolchain_missing' | 'output_too_large'; stderr: string; durationMs: number };

runInLanguage(lang: 'js' | 'go' | 'java', source: string, { timeoutMs = 10_000 }?): Promise<RunOutcome>
```

| Language | File | Commands (`cwd` = temporary directory) |
|---|---|---|
| `js` | `main.js` | `node main.js` |
| `go` | `main.go` | `go build -o main main.go`, then `<dir>/main` |
| `java` | `Main.java` | `java Main.java` (source-file mode) |

Every `execFile` uses `timeout`, `killSignal: 'SIGKILL'`, `maxBuffer: 1_048_576`, `encoding: 'utf8'` and a minimal environment (`PATH`, `HOME`, `GOCACHE`, `GOPATH`, `TMPDIR`, only the defined ones: never `DATABASE_URL` or `GENERATOR_SECRET`).

**Go does not use `go run`.** `go run` launches the compiled binary as its own child process, so the timeout's `SIGKILL` kills `go run` and leaves the binary orphaned, burning CPU (and killing the process group does not work in the sandbox). The runner builds first (a non-zero exit is `compile_error`) and then runs the binary, which is a direct child. One `timeoutMs` budget is shared by both phases.

**Failure classification** (in this order): `ENOENT` -> `toolchain_missing`; max buffer exceeded -> `output_too_large`; killed with `SIGKILL` -> `timeout`; Go build failure, Java `error: compilation failed` in stderr or JS `SyntaxError: ` in stderr -> `compile_error`; any other non-zero exit -> `runtime_error`.

**Non-root user.** If the process runs as root, `RUNNER_UID` and `RUNNER_GID` must be integers greater than 0; they are passed to `execFile` as `uid`/`gid`. Without them the runner returns `{ ok: false, kind: 'runtime_error', stderr: 'runner_requires_non_root', durationMs: 0 }` and runs nothing. Not root (local development): runs as the current user. Both variables are read on every call.

**`chown` (pending verification with the hosting).** `mkdtemp` creates the directory as `0700` owned by root, so before running as `RUNNER_UID` the runner `chown`s the directory and the source file to it. This cannot be tested without root and is covered by a mocked unit test.

`checkToolchains(): Promise<{ js, go, java }>` (each `{ ok, version }`) runs `node --version`, `go version` and `java -version` (read from stderr) and never throws if one is missing.

## How to use

- `emitProgram` / `wrapFunction` build one `main` per variant and language that runs **all** the inputs and prints one integer per line, so one process verifies every case.
- The code is written to a unique temporary directory per run and removed afterwards.
- `verify()` compares outputs across languages and against the expected values and records the result in the `VerificationLog`.

```ts
const outcomes = await Promise.all(
  LANGUAGES.map((l) => runInLanguage(l, wrapFunction(code[l], l, { entry: 'f', calls }))),
);
checks.push({ name: 'same_output_all_languages', ok: outcomes.every((o) => o.ok && o.stdout === expected) });
```

## Rules

- The runner uses `execFile` (never `exec` with a shell), with timeout 10 000 ms, and runs as a non-root user.
- Arguments are never built from untrusted strings; code goes in files, not in the command line.
- A timeout, a non-zero exit or a compile error is a failed check (candidate `rejected`), not an exception that stops the job: `runInLanguage` returns `ok: false` and never throws for a problem of the snippet.
- Only the `generator` imports `@nerdose/polyglot`. `./definition` and `./client` entries of games never import it, nor `node:child_process`.
- Required toolchains: Node 24, Go >= 1.25, JDK 21. Versions are not silently substituted.
- The runner makes no network calls; network isolation and resource limits are defined with the hosting (deferred).
- Temporary directories are unique per run and cleaned in a `finally`.
- Output size is bounded (`maxBuffer`).

## Integration with other conventions

- **challenge-generation**: `verify()` calls the runner.
- **logging**: log language, duration and exit status at `debug`; never the full source at `info`.
- **testing**: tests that run toolchains are integration tests and require them installed; a CI job compiles the emitted code.

---

Actualizado por REQ-009 (S-041).
