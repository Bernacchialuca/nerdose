export class HttpRequestError extends Error {
  constructor(
    readonly url: string,
    readonly status: number | null,
    detail?: string,
  ) {
    super(`Falló el request (${status ?? 'error de red'}): ${url}${detail ? ` - ${detail}` : ''}`);
    this.name = 'HttpRequestError';
  }
}

export type HttpClientOptions = {
  userAgent: string;
  fetch?: typeof globalThis.fetch;
  sleep?: (ms: number) => Promise<void>;
  delayMs?: number;
  maxRetries?: number;
  baseBackoffMs?: number;
};

export type HttpClient = {
  getText(url: string, options?: { accept?: string }): Promise<string>;
  getJson(url: string, options?: { accept?: string }): Promise<unknown>;
};

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export function buildUserAgent(version: string, contact: string): string {
  return `nerdose-content/${version} (${contact})`;
}

export function createHttpClient({
  userAgent,
  fetch = globalThis.fetch,
  sleep = defaultSleep,
  delayMs = 250,
  maxRetries = 5,
  baseBackoffMs = 1000,
}: HttpClientOptions): HttpClient {
  let requested = false;

  function retryDelay(response: Response | null, retry: number): number {
    const header = response?.headers.get('Retry-After')?.trim();
    if (header !== undefined && /^\d+$/.test(header)) return Number(header) * 1000;
    return baseBackoffMs * 2 ** (retry - 1);
  }

  async function getResponse(url: string, accept: string): Promise<Response> {
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
        if (response.ok) return response;
        throw new HttpRequestError(url, response.status);
      }
      if (retry >= maxRetries) {
        throw new HttpRequestError(url, response?.status ?? null, failure);
      }
      await sleep(retryDelay(response, retry + 1));
    }
  }

  return {
    async getText(url, { accept = 'text/plain' } = {}) {
      return (await getResponse(url, accept)).text();
    },
    async getJson(url, { accept = 'application/json' } = {}) {
      return (await getResponse(url, accept)).json() as Promise<unknown>;
    },
  };
}
