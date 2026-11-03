import { describe, expect, it } from 'vitest';

import { composeConfig } from './helpers/compose';

describe('compose.yaml', () => {
  const config = composeConfig();
  const postgres = config.services['postgres'];

  it('runs only PostgreSQL 16 alpine', () => {
    expect(Object.keys(config.services)).toEqual(['postgres']);
    expect(postgres?.image).toBe('postgres:16-alpine');
  });

  it('creates the nerdose database owned by nerdose_owner', () => {
    expect(postgres?.environment['POSTGRES_DB']).toBe('nerdose');
    expect(postgres?.environment['POSTGRES_USER']).toBe('nerdose_owner');
  });

  it('interpolates the password from the environment', () => {
    expect(postgres?.environment['POSTGRES_PASSWORD']).toBe('compose-test');
  });

  it('contains no literal password', () => {
    const raw = composeConfig({ interpolate: false });
    expect(raw.services['postgres']?.environment['POSTGRES_PASSWORD']).toBe('${POSTGRES_PASSWORD}');
  });

  it('publishes the port on loopback only', () => {
    expect(postgres?.ports).toEqual([
      { mode: 'ingress', host_ip: '127.0.0.1', target: 5432, published: '5432', protocol: 'tcp' },
    ]);
  });

  it('publishes no port on all interfaces', () => {
    for (const service of Object.values(config.services)) {
      for (const port of service.ports ?? []) {
        expect([undefined, '', '0.0.0.0']).not.toContain(port.host_ip);
      }
    }
  });

  it('stores data in a named volume', () => {
    expect(postgres?.volumes).toEqual([
      { type: 'volume', source: 'nerdose-pgdata', target: '/var/lib/postgresql/data', volume: {} },
    ]);
    expect(Object.keys(config.volumes ?? {})).toContain('nerdose-pgdata');
  });

  it('has a pg_isready healthcheck', () => {
    expect(postgres?.healthcheck).toEqual({
      test: ['CMD-SHELL', 'pg_isready -U nerdose_owner -d nerdose'],
      interval: '5s',
      retries: 10,
    });
  });
});

describe('composeConfig', () => {
  it('fails with a readable message when docker compose cannot read the file', () => {
    expect(() => composeConfig({ file: 'missing.yaml' })).toThrow('docker compose config failed');
  });
});
