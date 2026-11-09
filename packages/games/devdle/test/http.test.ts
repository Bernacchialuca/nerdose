import { describe, expect, it, vi } from 'vitest';

import { HttpRequestError, createHttpClient } from '../scripts/build-wordlist/http';

describe('http client', () => {
  it('retries with exponential backoff and then fails (TS-57)', async () => {
    const sleep = vi.fn<(ms: number) => Promise<void>>(async () => {});
    const fetch = vi.fn(async () => new Response('', { status: 503 }));
    const client = createHttpClient({ userAgent: 'ua', fetch, sleep });
    await expect(client.getJson('https://example.org/x')).rejects.toBeInstanceOf(HttpRequestError);
    expect(fetch).toHaveBeenCalledTimes(6);
    expect(sleep.mock.calls.map((c) => c[0])).toEqual([1000, 2000, 4000, 8000, 16000]);
  });

  it('honors Retry-After (TS-58)', async () => {
    const sleep = vi.fn(async () => {});
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '3' } }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }));
    const client = createHttpClient({ userAgent: 'ua', fetch, sleep });
    expect(await client.getJson('https://example.org/x')).toEqual({ ok: true });
    expect(sleep).toHaveBeenCalledWith(3000);
  });

  it('does not retry client errors', async () => {
    const fetch = vi.fn(async () => new Response('', { status: 404 }));
    const client = createHttpClient({ userAgent: 'ua', fetch, sleep: async () => {} });
    await expect(client.getText('https://example.org/x')).rejects.toBeInstanceOf(HttpRequestError);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
