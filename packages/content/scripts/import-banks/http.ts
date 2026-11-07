import type { FileCache } from './cache';

export class WikimediaRequestError extends Error {
  constructor(
    readonly url: string,
    readonly status: number | null,
    detail?: string,
  ) {
    super(
      `Falló el request a Wikimedia (${status ?? 'error de red'}): ${url}${detail ? ` - ${detail}` : ''}`,
    );
    this.name = 'WikimediaRequestError';
  }
}

export type WikimediaClientOptions = {
  userAgent: string;
  cache?: FileCache;
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
  delayMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
};

export type GetJsonOptions = { accept?: string; cacheable404?: boolean };

export type WikimediaClient = {
  getJson(url: string, options?: GetJsonOptions): Promise<{ status: number; body: unknown }>;
};

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function buildUserAgent(datasetVersion: string, contact: string): string {
  return `nerdose-content/${datasetVersion} (${contact})`;
}

export function createWikimediaClient({
  userAgent,
  cache,
  fetch = globalThis.fetch,
  sleep = defaultSleep,
  delayMs = 250,
  maxRetries = 5,
  baseBackoffMs = 1000,
}: WikimediaClientOptions): WikimediaClient {
  let requested = false;

  function retryDelay(response: Response | null, retry: number): number {
    const header = response?.headers.get('Retry-After');
    if (header !== null && header !== undefined && /^\d+$/.test(header.trim())) {
      return Number(header.trim()) * 1000;
    }
    return baseBackoffMs * 2 ** (retry - 1);
  }

  return {
    async getJson(url, { accept = 'application/json', cacheable404 = false } = {}) {
      const cached = cache?.get(url);
      if (cached) return cached;

      if (requested) await sleep(delayMs);
      requested = true;

      for (let retry = 0; ; retry++) {
        let response: Response | null = null;
        let failure: string | undefined;
        try {
          response = await fetch(url, { headers: { 'User-Agent': userAgent, Accept: accept } });
        } catch (error) {
          failure = (error as Error).message;
        }

        if (response !== null && response.status !== 429 && response.status < 500) {
          if (response.ok) {
            const entry = { status: response.status, body: (await response.json()) as unknown };
            cache?.set(url, entry);
            return entry;
          }
          if (response.status === 404) {
            const entry = { status: 404, body: null };
            if (cacheable404) cache?.set(url, entry);
            return entry;
          }
          throw new WikimediaRequestError(url, response.status);
        }
        if (retry >= maxRetries) {
          throw new WikimediaRequestError(url, response?.status ?? null, failure);
        }
        await sleep(retryDelay(response, retry + 1));
      }
    },
  };
}
