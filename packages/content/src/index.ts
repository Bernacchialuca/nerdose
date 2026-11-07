import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import { z } from 'zod';

import {
  manifestSchema,
  termsFileSchema,
  timelineFactsFileSchema,
  type DatasetManifest,
  type TermItem,
  type TimelineFactItem,
} from './schema';

export {
  DATE_PRECISIONS,
  REJECTION_REASONS,
  TIMELINE_CATEGORIES,
  manifestSchema,
  termItemSchema,
  termsFileSchema,
  timelineFactItemSchema,
  timelineFactsFileSchema,
  type DatasetManifest,
  type RejectionReason,
  type TermItem,
  type TimelineFactItem,
} from './schema';
export {
  compareWikidataId,
  serializeItems,
  serializeManifest,
  sortByWikidataId,
} from './serialize';

export type Dataset = {
  terms: TermItem[];
  timelineFacts: TimelineFactItem[];
  manifest: DatasetManifest;
};

export class DatasetError extends Error {
  constructor(
    readonly file: string,
    message: string,
  ) {
    super(message);
    this.name = 'DatasetError';
  }
}

function readJsonFile<T>(
  dir: string,
  file: string,
  schema: z.ZodType<T>,
  optional: boolean,
): T | undefined {
  let raw: string;
  try {
    raw = readFileSync(join(dir, file), 'utf8');
  } catch (error) {
    if (optional && (error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
    throw new DatasetError(file, `No se pudo leer ${file}: ${(error as Error).message}`);
  }
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new DatasetError(file, `${file} no es JSON válido: ${(error as Error).message}`);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    throw new DatasetError(file, `${file} inválido:\n${z.prettifyError(parsed.error)}`);
  }
  return parsed.data;
}

export function loadDataset(dataDir: string | URL = new URL('../data/', import.meta.url)): Dataset {
  const dir = typeof dataDir === 'string' ? dataDir : fileURLToPath(dataDir);
  const terms = readJsonFile(dir, 'terms.json', termsFileSchema, false) as TermItem[];
  const timelineFacts =
    readJsonFile(dir, 'timeline_facts.json', timelineFactsFileSchema, true) ?? [];
  const manifest = readJsonFile(dir, 'manifest.json', manifestSchema, false) as DatasetManifest;
  return { terms, timelineFacts, manifest };
}
