import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CWD = fileURLToPath(new URL('../..', import.meta.url));

// Go necesita HOME o GOCACHE para compilar; polyglot se los pasa al hijo solo si el proceso los tiene.
function toolchainEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of ['HOME', 'GOCACHE', 'GOPATH', 'TMPDIR']) {
    const value = process.env[key];
    if (value) out[key] = value;
  }
  return out;
}

export function startGenerator(env: Record<string, string>) {
  const child = spawn(process.execPath, ['--import', 'tsx', 'src/index.ts'], {
    cwd: CWD,
    env: {
      PATH: process.env.PATH,
      ...toolchainEnv(),
      NODE_ENV: 'test',
      LOG_LEVEL: 'info',
      ...env,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const lines: string[] = [];
  const waiters: Array<() => void> = [];
  let buffer = '';
  child.stdout.on('data', (chunk) => {
    buffer += String(chunk);
    const parts = buffer.split('\n');
    buffer = parts.pop() ?? '';
    lines.push(...parts.filter((line) => line.trim() !== ''));
    for (const wake of waiters.splice(0)) wake();
  });
  const exited = new Promise<number | null>((resolve) => child.on('exit', (code) => resolve(code)));
  void exited.then(() => {
    for (const wake of waiters.splice(0)) wake();
  });

  const parsed = () => lines.map((line) => JSON.parse(line) as Record<string, unknown>);

  async function waitForLog(
    predicate: (line: Record<string, unknown>) => boolean,
    timeoutMs = 30_000,
  ): Promise<Record<string, unknown>> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
      const found = parsed().find(predicate);
      if (found) return found;
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error(`Timeout esperando log. Líneas: ${lines.join(' | ')}`);
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, remaining);
        waiters.push(() => {
          clearTimeout(timer);
          resolve();
        });
      });
    }
  }

  return {
    lines: () => [...lines],
    parsed,
    waitForLog,
    exited,
    kill: (signal: NodeJS.Signals = 'SIGTERM') => child.kill(signal),
    stop: async (signal: NodeJS.Signals = 'SIGTERM') => {
      child.kill(signal);
      return exited;
    },
  };
}
