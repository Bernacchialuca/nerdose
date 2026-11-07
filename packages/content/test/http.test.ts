import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { createFileCache } from '../scripts/import-banks/cache';
import {
  WikimediaRequestError,
  buildUserAgent,
  createWikimediaClient,
} from '../scripts/import-banks/http';

const ok = (body: unknown): Response => new Response(JSON.stringify(body), { status: 200 });
const status = (code: number, headers: Record<string, string> = {}): Response =>
  new Response('', { status: code, headers });

function scripted(responses: (Response | Error)[]) {
  const fetch = vi.fn(async () => {
    const next = responses.shift();
    if (next === undefined) throw new Error('sin más respuestas');
    if (next instanceof Error) throw next;
    return next;
  });
  return fetch as unknown as typeof globalThis.fetch & typeof fetch;
}

describe('wikimedia client', () => {
  it('builds the User-Agent and sends it on every request (TS-23)', async () => {
    expect(buildUserAgent('2026.11.06', 'dev@example.com')).toBe(
      'nerdose-content/2026.11.06 (dev@example.com)',
    );
    const fetch = scripted([ok({ a: 1 }), ok({ b: 2 })]);
    const client = createWikimediaClient({
      userAgent: 'nerdose-content/2026.11.06 (dev@example.com)',
      fetch,
      sleep: async () => {},
    });
    await client.getJson('https://query.wikidata.org/sparql?x', {
      accept: 'application/sparql-results+json',
    });
    await client.getJson('https://es.wikipedia.org/api/rest_v1/page/summary/X');
    for (const [, init] of fetch.mock.calls as unknown as [string, RequestInit][]) {
      expect((init.headers as Record<string, string>)['User-Agent']).toBe(
        'nerdose-content/2026.11.06 (dev@example.com)',
      );
    }
    const accepts = (fetch.mock.calls as unknown as [string, RequestInit][]).map(
      ([, init]) => (init.headers as Record<string, string>)['Accept'],
    );
    expect(accepts).toEqual(['application/sparql-results+json', 'application/json']);
  });

  it('retries with backoff and honours Retry-After (TS-24)', async () => {
    const fetch = scripted([
      status(429, { 'Retry-After': '3' }),
      status(503),
      new TypeError('fetch failed'),
      ok({ done: true }),
    ]);
    const sleep = vi.fn(async () => {});
    const client = createWikimediaClient({ userAgent: 'ua', fetch, sleep });
    const result = await client.getJson('https://example.test/a');
    expect(result.body).toEqual({ done: true });
    expect(fetch).toHaveBeenCalledTimes(4);
    expect((sleep.mock.calls as unknown as [number][]).map(([ms]) => ms)).toEqual([
      3000, 2000, 4000,
    ]);
  });

  it('fails after exhausting retries (TS-25)', async () => {
    const fetch = scripted(Array.from({ length: 6 }, () => status(503)));
    const client = createWikimediaClient({
      userAgent: 'ua',
      fetch,
      sleep: async () => {},
      maxRetries: 5,
    });
    const error = await client.getJson('https://example.test/a').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(WikimediaRequestError);
    expect((error as WikimediaRequestError).status).toBe(503);
    expect((error as WikimediaRequestError).url).toBe('https://example.test/a');
    expect(fetch).toHaveBeenCalledTimes(6);
  });

  it('pauses between uncached requests (TS-26)', async () => {
    const order: string[] = [];
    const fetch = vi.fn(async () => {
      order.push('fetch');
      return ok({});
    }) as unknown as typeof globalThis.fetch;
    const sleep = vi.fn(async (ms: number) => {
      order.push(`sleep:${ms}`);
    });
    const client = createWikimediaClient({ userAgent: 'ua', fetch, sleep, delayMs: 250 });
    await client.getJson('https://example.test/1');
    await client.getJson('https://example.test/2');
    expect(order).toEqual(['fetch', 'sleep:250', 'fetch']);
  });

  it('resumes from the on-disk cache and caches 404 but not 503 (TS-27)', async () => {
    const dir = join(mkdtempSync(join(tmpdir(), 'nc-cache-')), 'cache');
    const make = (fetch: typeof globalThis.fetch) =>
      createWikimediaClient({
        userAgent: 'ua',
        fetch,
        sleep: async () => {},
        cache: createFileCache(dir),
        maxRetries: 0,
      });

    const first = scripted([ok({ v: 1 })]);
    await make(first).getJson('https://example.test/x');
    const second = scripted([]);
    expect((await make(second).getJson('https://example.test/x')).body).toEqual({ v: 1 });
    expect(second).not.toHaveBeenCalled();

    const notFound = scripted([status(404)]);
    const result = await make(notFound).getJson('https://example.test/missing', {
      cacheable404: true,
    });
    expect(result.status).toBe(404);
    const again = scripted([]);
    expect((await make(again).getJson('https://example.test/missing')).status).toBe(404);
    expect(again).not.toHaveBeenCalled();

    const failing = scripted([status(503)]);
    await expect(make(failing).getJson('https://example.test/boom')).rejects.toBeInstanceOf(
      WikimediaRequestError,
    );
    const retry = scripted([ok({ ok: 1 })]);
    await make(retry).getJson('https://example.test/boom');
    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('fails fast on non-retriable client errors', async () => {
    const fetch = scripted([status(403)]);
    const client = createWikimediaClient({ userAgent: 'ua', fetch, sleep: async () => {} });
    await expect(client.getJson('https://example.test/a')).rejects.toMatchObject({ status: 403 });
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
