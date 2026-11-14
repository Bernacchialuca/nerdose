import { fileURLToPath } from 'node:url';

import type { Rollup } from 'vite';

type OutputChunk = Rollup.OutputChunk;
type OutputAsset = Rollup.OutputAsset;

export type BuildOutput = { chunks: OutputChunk[]; assets: OutputAsset[] };

let memo: Promise<BuildOutput> | undefined;

/** Una sola build de Vite en memoria por archivo de test (las guardas de CSS y de chunks la comparten). */
export function buildAdmin(): Promise<BuildOutput> {
  memo ??= (async () => {
    const { build } = await import('vite');
    const output = await build({
      root: fileURLToPath(new URL('../..', import.meta.url)),
      logLevel: 'silent',
      build: { write: false },
    });
    const items = (Array.isArray(output) ? output : [output]).flatMap((o) =>
      'output' in o ? o.output : [],
    );
    return {
      chunks: items.filter((i): i is OutputChunk => i.type === 'chunk'),
      assets: items.filter((i): i is OutputAsset => i.type === 'asset'),
    };
  })();
  return memo;
}

export const compiledCss = ({ assets }: BuildOutput): string =>
  assets
    .filter((a) => a.fileName.endsWith('.css'))
    .map((a) => String(a.source))
    .join('\n');
