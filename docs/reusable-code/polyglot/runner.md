# Runner

## runInLanguage
- **Location:** packages/polyglot/src/runner/run.ts
- **Description:** Writes the source to a unique temp dir (removed in `finally`), runs it with `execFile` (no shell, `SIGKILL` timeout, 1 MiB buffer, minimal env). Go is built and then the binary runs (no `go run`), sharing one time budget. As root it requires `RUNNER_UID`/`RUNNER_GID` and `chown`s the dir and file; without them it returns `runner_requires_non_root` and runs nothing. Never throws for a snippet problem; own infrastructure errors (`mkdtemp`, `writeFile`) propagate.
- **Signature:** `runInLanguage(lang: Language, source: string, options?: { timeoutMs?: number }): Promise<RunOutcome>`
- **Usage:** `const out = await runInLanguage('go', wrapFunction(code, 'go', { entry: 'f', calls })); if (out.ok) out.stdout.split('\n')`

## RunOutcome / RunFailureKind / RunOptions
- **Location:** packages/polyglot/src/runner/outcome.ts
- **Description:** `ok: true` carries `stdout` and integer `durationMs`; `ok: false` carries `kind` (`timeout`, `compile_error`, `runtime_error`, `toolchain_missing`, `output_too_large`), `stderr` and `durationMs`.
- **Signature:** `type RunOutcome = { ok: true; stdout: string; durationMs: number } | { ok: false; kind: RunFailureKind; stderr: string; durationMs: number }`
- **Usage:** `detail: out.ok ? 'ok' : out.kind`

## RUN_TIMEOUT_MS / RUN_MAX_BUFFER_BYTES
- **Location:** packages/polyglot/src/runner/outcome.ts
- **Description:** Default timeout (10 000 ms) and `maxBuffer` (1 048 576 bytes).
- **Signature:** `const RUN_TIMEOUT_MS: 10_000`; `const RUN_MAX_BUFFER_BYTES: 1_048_576`
- **Usage:** `runInLanguage(lang, src, { timeoutMs: RUN_TIMEOUT_MS })`

## checkToolchains / ToolchainReport
- **Location:** packages/polyglot/src/runner/toolchains.ts
- **Description:** Runs `node --version`, `go version`, `java -version` (stderr). Never throws; a missing toolchain is `{ ok: false, version: null }`. Used by the integration test helper and reusable for the generator's startup `warn`.
- **Signature:** `checkToolchains(): Promise<{ js: ToolchainStatus; go: ToolchainStatus; java: ToolchainStatus }>` with `ToolchainStatus = { ok: boolean; version: string | null }`
- **Usage:** `const report = await checkToolchains(); if (!report.go.ok) logger.warn('go missing')`

## parseNodeMajor / parseGoVersion / parseJavaMajor
- **Location:** packages/polyglot/src/runner/toolchains.ts
- **Description:** Extract versions from the toolchains' output; `null` if it does not match.
- **Signature:** `parseNodeMajor(s): number | null`; `parseGoVersion(s): { major: number; minor: number } | null`; `parseJavaMajor(s): number | null`
- **Usage:** `parseGoVersion('go version go1.26.0 linux/amd64') // { major: 1, minor: 26 }`

## classifyFailure
- **Location:** packages/polyglot/src/runner/outcome.ts
- **Description:** Internal pure function mapping an `execFile` error plus stderr to a `RunFailureKind`, in the order ENOENT, max buffer, SIGKILL, compile signature, runtime.
- **Signature:** `classifyFailure(lang: Language, phase: 'build' | 'run', error: Pick<ExecFileException, 'code' | 'killed' | 'signal'>, stderr: string): RunFailureKind`
- **Usage:** `classifyFailure('go', 'build', { code: 1 }, stderr) // 'compile_error'`
