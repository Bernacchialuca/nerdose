import {
  checkToolchains,
  parseGoVersion,
  parseJavaMajor,
  parseNodeMajor,
  type ToolchainReport,
} from '@nerdose/polyglot';

const HINT = 'see README "Requisitos"';

/**
 * Called in the `beforeAll` of every integration file. There is no skip: if a toolchain is missing
 * or has the wrong version the test fails with a message that names it.
 */
export async function requireToolchains(
  check: () => Promise<ToolchainReport> = checkToolchains,
): Promise<void> {
  const report = await check();

  if (!report.js.ok) throw new Error(`Missing toolchain: node (Node 24 required, ${HINT})`);
  if (parseNodeMajor(report.js.version ?? '') !== 24) {
    throw new Error(
      `Wrong toolchain version: node (found ${report.js.version}, Node 24 required, ${HINT})`,
    );
  }

  if (!report.go.ok) throw new Error(`Missing toolchain: go (Go >= 1.25 required, ${HINT})`);
  const go = parseGoVersion(report.go.version ?? '');
  if (go === null || go.major < 1 || (go.major === 1 && go.minor < 25)) {
    const found = /go\d+\.\d+(\.\d+)?/.exec(report.go.version ?? '')?.[0] ?? report.go.version;
    throw new Error(`Wrong toolchain version: go (found ${found}, Go >= 1.25 required, ${HINT})`);
  }

  if (!report.java.ok) throw new Error(`Missing toolchain: java (JDK 21 required, ${HINT})`);
  if (parseJavaMajor(report.java.version ?? '') !== 21) {
    throw new Error(
      `Wrong toolchain version: java (found ${report.java.version}, JDK 21 required, ${HINT})`,
    );
  }
}
