import { checkToolchains, type ToolchainReport } from '@nerdose/polyglot';
import type { Logger } from 'pino';

const REQUIRED = [
  { toolchain: 'go', required: 'Go >= 1.25' },
  { toolchain: 'java', required: 'JDK 21' },
] as const;

/** El arranque no valida los toolchains (REQ-009): avisa y sigue; Big O rechaza con run_<lang>: toolchain_missing. */
export async function warnMissingToolchains(
  log: Logger,
  check: () => Promise<ToolchainReport> = checkToolchains,
): Promise<void> {
  let report: ToolchainReport;
  try {
    report = await check();
  } catch (err) {
    log.warn({ err }, 'Toolchain check failed');
    return;
  }
  for (const { toolchain, required } of REQUIRED) {
    if (!report[toolchain].ok) log.warn({ toolchain, required }, 'Toolchain missing at startup');
  }
}
