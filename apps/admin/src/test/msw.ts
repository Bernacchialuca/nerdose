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

export const server = setupServer();

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
