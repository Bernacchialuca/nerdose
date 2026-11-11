import { mkdirSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import {
  manifestSchema,
  termsFileSchema,
  timelineFactsFileSchema,
  type DatasetManifest,
  type TermItem,
  type TimelineFactItem,
} from '../../src/schema';
import { serializeItems, serializeManifest } from '../../src/serialize';

export function writeDataset(
  dataDir: string,
  {
    terms,
    timelineFacts,
    manifest,
  }: { terms: TermItem[]; timelineFacts: TimelineFactItem[]; manifest: DatasetManifest },
): void {
  termsFileSchema.parse(terms);
  timelineFactsFileSchema.parse(timelineFacts);
  manifestSchema.parse(manifest);
  mkdirSync(dataDir, { recursive: true });
  const files = [
    ['terms.json', serializeItems(terms)],
    ['timeline_facts.json', serializeItems(timelineFacts)],
    ['manifest.json', serializeManifest(manifest)],
  ] as const;
  for (const [name, content] of files) writeFileSync(join(dataDir, `${name}.tmp`), content);
  for (const [name] of files) renameSync(join(dataDir, `${name}.tmp`), join(dataDir, name));
}
