import { parseArgs } from 'node:util';

import { AppError } from '@nerdose/core';

export type ImportArgs = { minSitelinks?: number; cacheDir?: string };

export function parseImportArgs(argv: readonly string[]): ImportArgs {
  let values: { 'min-sitelinks'?: string; 'cache-dir'?: string };
  try {
    ({ values } = parseArgs({
      args: [...argv],
      options: {
        'min-sitelinks': { type: 'string' },
        'cache-dir': { type: 'string' },
      },
      strict: true,
    }));
  } catch (error) {
    throw new AppError('validation_error', `Argumentos inválidos: ${(error as Error).message}`);
  }
  const args: ImportArgs = {};
  const raw = values['min-sitelinks'];
  if (raw !== undefined) {
    if (!/^\d+$/.test(raw)) {
      throw new AppError(
        'validation_error',
        `--min-sitelinks debe ser un entero mayor o igual a 0 (recibido: ${raw})`,
      );
    }
    args.minSitelinks = Number(raw);
  }
  if (values['cache-dir'] !== undefined) args.cacheDir = values['cache-dir'];
  return args;
}
