import { delay, http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

export type RecordedRequest = {
  method: string;
  url: string;
  pathname: string;
  search: string;
  headers: Headers;
  body: unknown;
};

export const requests: RecordedRequest[] = [];

// Handler por defecto del contador del shell: no se registra en `requests`
// para no ensuciar las aserciones de los tests que no lo usan.
const defaultGenerationFailures = http.get('/api/admin/generation-failures', () =>
  HttpResponse.json({ failures: [] }),
);

// Última instancia: ningún request de un test sale a la red. jsdom usa la URL del dev server
// (localhost:5174); sin esto, un request sin handler (o con un handler que devuelve undefined)
// llega al `pnpm dev` real si está corriendo y su respuesta (p. ej. un 401) cambia el resultado
// del test. Se responde como si no hubiera servidor: error de red, igual que sin `pnpm dev`.
const noNetwork = http.all('/api/*', () => HttpResponse.error());

export const server = setupServer(defaultGenerationFailures, noNetwork);

async function record(request: Request): Promise<void> {
  const url = new URL(request.url);
  const text = await request.clone().text();
  let body: unknown = text === '' ? undefined : text;
  try {
    body = text === '' ? undefined : JSON.parse(text);
  } catch {
    /* body no JSON: queda el texto */
  }
  requests.push({
    method: request.method,
    url: request.url,
    pathname: url.pathname,
    search: url.search,
    headers: request.headers,
    body,
  });
}

export const adminHandlers = {
  reports: (status: string, body: unknown, init?: ResponseInit) =>
    http.get('/api/admin/reports', async ({ request }) => {
      if (new URL(request.url).searchParams.get('status') !== status) return undefined;
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  reportsPending: () =>
    http.get('/api/admin/reports', async ({ request }) => {
      await record(request);
      await delay('infinite');
      return HttpResponse.json({ groups: [] });
    }),
  reportsAny: (body: unknown, init?: ResponseInit) =>
    http.get('/api/admin/reports', async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  reportsNetworkError: () =>
    http.get('/api/admin/reports', async ({ request }) => {
      await record(request);
      return HttpResponse.error();
    }),
  patchReport: (id: string, body: unknown, init?: ResponseInit) =>
    http.patch(`/api/admin/reports/${id}`, async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  patchReportNetworkError: (id: string) =>
    http.patch(`/api/admin/reports/${id}`, async ({ request }) => {
      await record(request);
      return HttpResponse.error();
    }),
  voidChallenge: (id: string, body: unknown, init?: ResponseInit) =>
    http.post(`/api/admin/challenges/${id}/void`, async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  voidChallengeNetworkError: (id: string) =>
    http.post(`/api/admin/challenges/${id}/void`, async ({ request }) => {
      await record(request);
      return HttpResponse.error();
    }),
  upcoming: (body: unknown, init?: ResponseInit) =>
    http.get('/api/admin/challenges/upcoming', async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  upcomingSequence: (bodies: unknown[]) => {
    let i = 0;
    return http.get('/api/admin/challenges/upcoming', async ({ request }) => {
      await record(request);
      const body = bodies[Math.min(i++, bodies.length - 1)];
      return HttpResponse.json(body as object);
    });
  },
  upcomingPending: () =>
    http.get('/api/admin/challenges/upcoming', async ({ request }) => {
      await record(request);
      await delay('infinite');
      return HttpResponse.json({ days: [], active_failures: 0 });
    }),
  contentStock: (body: unknown, init?: ResponseInit) =>
    http.get('/api/admin/content/stock', async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  contentStockPending: () =>
    http.get('/api/admin/content/stock', async ({ request }) => {
      await record(request);
      await delay('infinite');
      return HttpResponse.json({ banks: [], last_sync: null, top_rejected_guesses: [] });
    }),
  contentStockNetworkError: () =>
    http.get('/api/admin/content/stock', async ({ request }) => {
      await record(request);
      return HttpResponse.error();
    }),
  regenerate: (id: string, body: unknown, init?: ResponseInit) =>
    http.post(`/api/admin/challenges/${id}/regenerate`, async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  regeneratePending: (id: string) =>
    http.post(`/api/admin/challenges/${id}/regenerate`, async ({ request }) => {
      await record(request);
      await delay('infinite');
      return HttpResponse.json({});
    }),
  regenerateNetworkError: (id: string) =>
    http.post(`/api/admin/challenges/${id}/regenerate`, async ({ request }) => {
      await record(request);
      return HttpResponse.error();
    }),
  metrics: (body: unknown, init?: ResponseInit) =>
    http.get('/api/admin/metrics', async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  metricsSequence: (responses: { body: unknown; init?: ResponseInit }[]) => {
    let i = 0;
    return http.get('/api/admin/metrics', async ({ request }) => {
      await record(request);
      const next = responses[Math.min(i++, responses.length - 1)];
      return HttpResponse.json((next?.body ?? {}) as object, next?.init);
    });
  },
  metricsByRange: (bodies: Record<string, unknown>) =>
    http.get('/api/admin/metrics', async ({ request }) => {
      await record(request);
      const body = bodies[new URL(request.url).search];
      if (body === undefined) return HttpResponse.error();
      return HttpResponse.json(body as object);
    }),
  metricsPending: () =>
    http.get('/api/admin/metrics', async ({ request }) => {
      await record(request);
      await delay('infinite');
      return HttpResponse.json({});
    }),
  metricsNetworkError: () =>
    http.get('/api/admin/metrics', async ({ request }) => {
      await record(request);
      return HttpResponse.error();
    }),
  /** El body puede depender del request (p. ej. del banco o la página pedidos). */
  bankItems: (body: object | ((url: URL) => object), init?: ResponseInit) =>
    http.get('/api/admin/content/items', async ({ request }) => {
      await record(request);
      const payload = typeof body === 'function' ? body(new URL(request.url)) : body;
      return HttpResponse.json(payload, init);
    }),
  bankItemsNetworkError: () =>
    http.get('/api/admin/content/items', async ({ request }) => {
      await record(request);
      return HttpResponse.error();
    }),
  generationFailures: (body: unknown, init?: ResponseInit) =>
    http.get('/api/admin/generation-failures', async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  login: (body: unknown, init?: ResponseInit) =>
    http.post('/api/admin/login', async ({ request }) => {
      await record(request);
      return HttpResponse.json(body as object, init);
    }),
  loginNetworkError: () =>
    http.post('/api/admin/login', async ({ request }) => {
      await record(request);
      return HttpResponse.error();
    }),
};

export const apiError = (code: string, message: string) => ({ error: { code, message } });

export const requestsTo = (method: string, pathname: string) =>
  requests.filter((r) => r.method === method && r.pathname === pathname);
