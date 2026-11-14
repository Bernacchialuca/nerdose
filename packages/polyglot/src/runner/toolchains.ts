import { buildChildEnv } from './child-env';
import { run } from './exec';
import { RUN_MAX_BUFFER_BYTES, RUN_TIMEOUT_MS } from './outcome';

export type ToolchainStatus = { ok: boolean; version: string | null };
export type ToolchainReport = { js: ToolchainStatus; go: ToolchainStatus; java: ToolchainStatus };

export function parseNodeMajor(output: string): number | null {
  const m = /^v(\d+)\./.exec(output.trim());
  return m ? Number(m[1]) : null;
}

export function parseGoVersion(output: string): { major: number; minor: number } | null {
  const m = /go(\d+)\.(\d+)/.exec(output);
  return m ? { major: Number(m[1]), minor: Number(m[2]) } : null;
}

export function parseJavaMajor(output: string): number | null {
  const m = /version "(\d+)/.exec(output);
  return m ? Number(m[1]) : null;
}

async function probe(
  command: string,
  args: string[],
  fromStderr = false,
): Promise<ToolchainStatus> {
  const result = await run(command, args, {
    timeout: RUN_TIMEOUT_MS,
    killSignal: 'SIGKILL',
    maxBuffer: RUN_MAX_BUFFER_BYTES,
    env: buildChildEnv(process.env),
    encoding: 'utf8',
  });
  if (result.error !== null) return { ok: false, version: null };
  // `java -version` writes to stderr.
  return { ok: true, version: (fromStderr ? result.stderr : result.stdout).trim() };
}

/** Reports which toolchains are installed and their version; never throws if one is missing. */
export async function checkToolchains(): Promise<ToolchainReport> {
  const [js, go, java] = await Promise.all([
    probe('node', ['--version']),
    probe('go', ['version']),
    probe('java', ['-version'], true),
  ]);
  return { js, go, java };
}
