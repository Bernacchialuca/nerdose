import { parseArgs } from 'node:util';

import { AppError } from '@nerdose/core';

export type WordlistArgs = { enable: string };

export function parseWordlistArgs(argv: readonly string[]): WordlistArgs {
  let values: { enable?: string };
  try {
    ({ values } = parseArgs({
      args: [...argv],
      options: { enable: { type: 'string' } },
      strict: true,
    }));
  } catch (error) {
    throw new AppError('validation_error', `Argumentos inválidos: ${(error as Error).message}`);
  }
  if (!values.enable) {
    throw new AppError('validation_error', 'Falta --enable <ruta-o-url> (diccionario ENABLE)');
  }
  return { enable: values.enable };
}
