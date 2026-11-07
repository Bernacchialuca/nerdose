import { AppError } from '@nerdose/core';

export type ImportEnv = { WIKIMEDIA_CONTACT: string };

export function loadImportEnv(runtimeEnv: Record<string, string | undefined>): ImportEnv {
  const contact = runtimeEnv.WIKIMEDIA_CONTACT?.trim();
  if (!contact) {
    throw new AppError('validation_error', 'Variables de entorno inválidas: WIKIMEDIA_CONTACT');
  }
  return { WIKIMEDIA_CONTACT: contact };
}
