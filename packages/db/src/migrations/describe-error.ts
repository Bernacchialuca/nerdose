const CONNECTION_CODES = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNRESET',
  'EHOSTUNREACH',
  'CONNECT_TIMEOUT',
  '28P01',
  '28000',
  '3D000',
]);

function codeOf(value: unknown): string | undefined {
  if (typeof value === 'object' && value !== null && 'code' in value) {
    const { code } = value;
    return typeof code === 'string' ? code : undefined;
  }
  return undefined;
}

export function describeMigrateError(error: unknown): string {
  const cause = error instanceof Error ? error.cause : undefined;
  const code = [codeOf(error), codeOf(cause)].find((c) => c !== undefined && CONNECTION_CODES.has(c));
  if (code !== undefined) {
    return `No se pudo conectar a PostgreSQL con DATABASE_URL_OWNER (${code})`;
  }
  return `db:migrate falló: ${error instanceof Error ? error.message : String(error)}`;
}
