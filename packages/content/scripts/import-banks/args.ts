import { parseArgs } from 'node:util';

import { AppError } from '@nerdose/core';

export const IMPORT_BANKS = ['terms', 'timeline', 'all'] as const;
export type ImportBank = (typeof IMPORT_BANKS)[number];

export type ImportArgs = {
  bank: ImportBank;
  minSitelinks?: number;
  minSitelinksTimeline?: number;
  cacheDir?: string;
};

function parseCount(name: string, raw: string): number {
  if (!/^\d+$/.test(raw)) {
    throw new AppError(
      'validation_error',
      `--${name} debe ser un entero mayor o igual a 0 (recibido: ${raw})`,
    );
  }
  return Number(raw);
}

// parseArgs toma "-1" por una opción corta; se pega a su flag para validar el valor nosotros.
function joinFlagValues(argv: readonly string[]): string[] {
  const joined: string[] = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i] as string;
    const next = argv[i + 1];
    if (/^--[a-z-]+$/.test(arg) && next !== undefined && /^-\d/.test(next)) {
      joined.push(`${arg}=${next}`);
      i += 1;
    } else {
      joined.push(arg);
    }
  }
  return joined;
}

export function parseImportArgs(argv: readonly string[]): ImportArgs {
  let values: {
    bank?: string;
    'min-sitelinks'?: string;
    'min-sitelinks-timeline'?: string;
    'cache-dir'?: string;
  };
  try {
    ({ values } = parseArgs({
      args: joinFlagValues(argv),
      options: {
        bank: { type: 'string' },
        'min-sitelinks': { type: 'string' },
        'min-sitelinks-timeline': { type: 'string' },
        'cache-dir': { type: 'string' },
      },
      strict: true,
    }));
  } catch (error) {
    throw new AppError('validation_error', `Argumentos inválidos: ${(error as Error).message}`);
  }
  const bank = values.bank ?? 'all';
  if (!(IMPORT_BANKS as readonly string[]).includes(bank)) {
    throw new AppError(
      'validation_error',
      `--bank debe ser uno de: ${IMPORT_BANKS.join(', ')} (recibido: ${bank})`,
    );
  }
  const args: ImportArgs = { bank: bank as ImportBank };
  const minSitelinks = values['min-sitelinks'];
  if (minSitelinks !== undefined) args.minSitelinks = parseCount('min-sitelinks', minSitelinks);
  const minTimeline = values['min-sitelinks-timeline'];
  if (minTimeline !== undefined) {
    args.minSitelinksTimeline = parseCount('min-sitelinks-timeline', minTimeline);
  }
  if (values['cache-dir'] !== undefined) args.cacheDir = values['cache-dir'];
  return args;
}
