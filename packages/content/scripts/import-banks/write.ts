import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  manifestSchema,
  termsFileSchema,
  type DatasetManifest,
  type TermItem,
} from '../../src/schema';
import { serializeItems, serializeManifest } from '../../src/serialize';

export function writeDataset(
  dataDir: string,
  { terms, manifest }: { terms: TermItem[]; manifest: DatasetManifest },
): void {
  termsFileSchema.parse(terms);
  manifestSchema.parse(manifest);
  mkdirSync(dataDir, { recursive: true });
  const files = [
    ['terms.json', serializeItems(terms)],
    ['manifest.json', serializeManifest(manifest)],
  ] as const;
  for (const [name, content] of files) writeFileSync(join(dataDir, `${name}.tmp`), content);
  for (const [name] of files) renameSync(join(dataDir, `${name}.tmp`), join(dataDir, name));
}
