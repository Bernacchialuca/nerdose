import { AppError, ERROR_CATALOG } from '@nerdose/core';
import { describe, expect, it } from 'vitest';

import { errorMessage } from '@/http/error-messages';
import { buildApp } from '@/http/app';

import { captureLogger } from '../helpers/logger';

const NOT_FOUND = { error: { code: 'not_found', message: 'Recurso no encontrado.' } };
const okHealth = { check: async () => ({ status: 'ok', db: 'ok' }) as const };

function appWith(check: () => Promise<never> | Promise<{ status: 'ok'; db: 'ok' }>) {
  const captured = captureLogger();
  const app = buildApp({ logger: captured.logger, health: { check } });
  return { app, ...captured };
}

describe('notFound', () => {
  const { logger } = captureLogger();
  const app = buildApp({ logger, health: okHealth });

  it.each(['/api/no-existe', '/api/admin/no-existe'])('GET %s responde 404', async (path) => {
    const res = await app.request(path);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(NOT_FOUND);
  });

  it('método no definido sobre health responde 404', async () => {
    const res = await app.request('/api/health', { method: 'POST' });
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual(NOT_FOUND);
  });
});

describe('errorHandler', () => {
  it('AppError usa el status del catálogo y loguea warn sin stack', async () => {
    const { app, lines } = appWith(async () => {
      throw new AppError('rate_limited');
    });
    const res = await app.request('/api/health');
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({
      error: { code: 'rate_limited', message: errorMessage('rate_limited') },
    });
    const line = lines().find((l) => l.msg === 'Application error');
    expect(line).toMatchObject({ level: 'warn', code: 'rate_limited' });
    expect(JSON.stringify(line)).not.toContain('stack');
  });

  it('error inesperado responde 500 genérico y loguea error con stack', async () => {
    const { app, lines } = appWith(async () => {
      throw new Error('boom: password=secreto');
    });
    const res = await app.request('/api/health');
    const text = await res.text();
    expect(res.status).toBe(500);
    expect(JSON.parse(text)).toEqual({
      error: { code: 'internal_error', message: 'Error interno del servidor.' },
    });
    expect(text).not.toContain('boom');
    expect(text).not.toContain('secreto');
    const line = lines().find((l) => l.msg === 'Unexpected error');
    expect(line).toMatchObject({ level: 'error' });
    expect((line?.err as { stack?: string }).stack).toBeTruthy();
  });
});

describe('errorMessage', () => {
  it('cubre todo el catálogo', () => {
    const codes = Object.keys(ERROR_CATALOG) as Array<keyof typeof ERROR_CATALOG>;
    expect(codes).toHaveLength(21);
    for (const code of codes) expect(errorMessage(code)).not.toBe('');
    expect(errorMessage('not_found')).toBe('Recurso no encontrado.');
    expect(errorMessage('internal_error')).toBe('Error interno del servidor.');
  });
});
