import { AppError } from '@nerdose/core';

export type WordlistEnv = { WIKIMEDIA_CONTACT: string };

export function loadWordlistEnv(runtimeEnv: Record<string, string | undefined>): WordlistEnv {
  const contact = runtimeEnv.WIKIMEDIA_CONTACT?.trim();
  if (!contact) {
    throw new AppError('validation_error', 'Variables de entorno inválidas: WIKIMEDIA_CONTACT');
  }
  return { WIKIMEDIA_CONTACT: contact };
}
