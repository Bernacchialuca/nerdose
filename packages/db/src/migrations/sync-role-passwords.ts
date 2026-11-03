import { AppError } from '@nerdose/core';
import type { Sql } from 'postgres';

export const SERVICE_ROLES = {
  api: { role: 'nerdose_api', variable: 'DATABASE_URL_API' },
  generator: { role: 'nerdose_generator', variable: 'DATABASE_URL_GENERATOR' },
} as const;

type ServiceRole = (typeof SERVICE_ROLES)[keyof typeof SERVICE_ROLES]['role'];

function parseCredentials(key: keyof typeof SERVICE_ROLES, raw: string) {
  const { role, variable } = SERVICE_ROLES[key];
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new AppError('validation_error', `${variable} no es una URL válida`);
  }
  const user = decodeURIComponent(url.username);
  if (user !== role) {
    throw new AppError(
      'validation_error',
      `${variable} debe usar el usuario ${role} (recibido: ${user})`,
    );
  }
  const password = decodeURIComponent(url.password);
  if (password === '') {
    throw new AppError('validation_error', `${variable} no tiene contraseña`);
  }
  return { role, password };
}

export async function syncRolePasswords(
  sql: Sql,
  urls: { api?: string; generator?: string },
): Promise<ServiceRole[]> {
  const pending = (['api', 'generator'] as const).flatMap((key) => {
    const raw = urls[key];
    return raw === undefined ? [] : [parseCredentials(key, raw)];
  });

  for (const { role, password } of pending) {
    // ALTER ROLE ... PASSWORD no admite parámetros ligados ni lo expresa Drizzle: format('%L') escapa el literal.
    const [row] = await sql<{ stmt: string }[]>`
      SELECT format('ALTER ROLE %I PASSWORD %L', ${role}::text, ${password}::text) AS stmt`;
    await sql.unsafe(row!.stmt);
  }
  return pending.map(({ role }) => role);
}
