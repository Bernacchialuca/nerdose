import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import i18n from '@/i18n';
import { todayKeys, useToday } from '@/modules/catalog';
import { sessionFixture } from '@/test/fixtures/session';
import { todayFixture, todayNoSessionFixture } from '@/test/fixtures/today';
import { server } from '@/test/msw';

import { SessionProvider } from './session-provider';
import { useSession } from './use-session';

function Probe() {
  const { status, canPlay, locale, changeLocale } = useSession();
  useToday();
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="can-play">{String(canPlay)}</p>
      <p data-testid="locale">{locale}</p>
      <button type="button" onClick={() => void changeLocale('en')}>
        to-en
      </button>
      <button type="button" onClick={() => void changeLocale('es')}>
        to-es
      </button>
    </div>
  );
}

let client: QueryClient;
function setup(strict = false) {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree = (
    <QueryClientProvider client={client}>
      <I18nextProvider i18n={i18n}>
        <SessionProvider>
          <Probe />
        </SessionProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

const status = () => screen.getByTestId('status').textContent;
const log: string[] = [];
const bodies: unknown[] = [];

function track(
  session: () => Response | Promise<Response> = () => HttpResponse.json(sessionFixture),
) {
  server.use(
    http.post('/api/session', ({ request }) => {
      log.push('POST session');
      bodies.push({
        ct: request.headers.get('content-type'),
        accept: request.headers.get('accept'),
      });
      return session();
    }),
    http.get('/api/today', ({ request }) => {
      log.push(`GET today?lang=${new URL(request.url).searchParams.get('lang')}`);
      return HttpResponse.json(todayFixture);
    }),
  );
}
const patchOk = (calls: unknown[]) =>
  http.patch('/api/me/preferences', async ({ request }) => {
    const body = (await request.json()) as { locale: string };
    calls.push({ body, ct: request.headers.get('content-type') });
    return HttpResponse.json({ locale: body.locale, preferred_code_language: 'js' });
  });
const unauth = () =>
  HttpResponse.json(
    { error: { code: 'no_session', message: 'Activá las cookies para jugar' } },
    { status: 401 },
  );

beforeEach(() => {
  log.length = 0;
  bodies.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

describe('SessionProvider', () => {
  it('TS-1 crea la sesión con el contrato correcto', async () => {
    track();
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    expect(log.filter((l) => l === 'POST session')).toHaveLength(1);
    expect(bodies[0]).toEqual({ ct: 'application/json', accept: 'application/json' });
  });

  it('TS-2 toma el locale devuelto', async () => {
    track(() => HttpResponse.json({ ...sessionFixture, locale: 'en' }));
    setup();
    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });
    expect(document.documentElement.lang).toBe('en');
    expect(i18n.language).toBe('en');
  });

  it('TS-3 primera visita en español', async () => {
    track(() => HttpResponse.json({ ...sessionFixture, created: true }));
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    expect(document.documentElement.lang).toBe('es');
  });

  it('TS-4 un solo POST en StrictMode', async () => {
    track();
    setup(true);
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    expect(log.filter((l) => l === 'POST session')).toHaveLength(1);
  });

  it('TS-5 pide today después de la sesión y con lang', async () => {
    track(() => HttpResponse.json({ ...sessionFixture, locale: 'en' }));
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    const iSession = log.indexOf('POST session');
    expect(iSession).toBeGreaterThanOrEqual(0);
    expect(log.slice(iSession + 1)).toContain('GET today?lang=en');
  });

  it('TS-6 cambia de idioma con sesión, sin recargar y persistido', async () => {
    track();
    const patches: unknown[] = [];
    server.use(patchOk(patches));
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    await userEvent.click(screen.getByRole('button', { name: 'to-en' }));
    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });
    expect(patches).toEqual([{ body: { locale: 'en' }, ct: 'application/json' }]);
    expect(document.documentElement.lang).toBe('en');
    await waitFor(() => {
      expect(log).toContain('GET today?lang=en');
    });
  });

  it('TS-9 click en el idioma ya activo no hace nada', async () => {
    track();
    const patches: unknown[] = [];
    server.use(patchOk(patches));
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    await userEvent.click(screen.getByRole('button', { name: 'to-es' }));
    expect(patches).toHaveLength(0);
    expect(screen.getByTestId('locale')).toHaveTextContent('es');
  });

  it('TS-10 PATCH 401 re-crea la sesión y reintenta una vez', async () => {
    track();
    let n = 0;
    server.use(
      http.patch('/api/me/preferences', async ({ request }) => {
        log.push('PATCH');
        n += 1;
        if (n === 1) return unauth();
        const body = (await request.json()) as { locale: string };
        return HttpResponse.json({ locale: body.locale, preferred_code_language: 'js' });
      }),
    );
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    log.length = 0;
    await userEvent.click(screen.getByRole('button', { name: 'to-en' }));
    await waitFor(() => {
      expect(log.filter((l) => l === 'PATCH')).toHaveLength(2);
    });
    expect(log.filter((l) => !l.startsWith('GET'))).toEqual(['PATCH', 'POST session', 'PATCH']);
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
  });

  it('TS-11 PATCH 401 dos veces queda solo en cliente', async () => {
    track();
    server.use(
      http.patch('/api/me/preferences', () => {
        log.push('PATCH');
        return unauth();
      }),
    );
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    log.length = 0;
    await userEvent.click(screen.getByRole('button', { name: 'to-en' }));
    await waitFor(() => {
      expect(log.filter((l) => l === 'PATCH')).toHaveLength(2);
    });
    expect(log.filter((l) => l === 'POST session')).toHaveLength(1);
    expect(screen.getByTestId('locale')).toHaveTextContent('en');
    expect(status()).toBe('active');
  });

  it('TS-12 PATCH 429 mantiene el idioma elegido', async () => {
    track();
    server.use(
      http.patch('/api/me/preferences', () => {
        log.push('PATCH');
        return HttpResponse.json(
          { error: { code: 'rate_limited', message: 'Demasiadas solicitudes' } },
          { status: 429, headers: { 'Retry-After': '60' } },
        );
      }),
    );
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    await userEvent.click(screen.getByRole('button', { name: 'to-en' }));
    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });
    expect(log.filter((l) => l === 'PATCH')).toHaveLength(1);
    expect(document.documentElement.lang).toBe('en');
  });

  it('TS-13 cookies bloqueadas expone status y canPlay', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)));
    setup();
    await waitFor(() => {
      expect(status()).toBe('cookies_blocked');
    });
    expect(screen.getByTestId('can-play')).toHaveTextContent('false');
  });

  it('TS-14 con cookies bloqueadas el selector funciona solo en cliente', async () => {
    track();
    const patches: unknown[] = [];
    server.use(
      patchOk(patches),
      http.get('/api/today', ({ request }) => {
        log.push(`GET today?lang=${new URL(request.url).searchParams.get('lang')}`);
        return HttpResponse.json(todayNoSessionFixture);
      }),
    );
    setup();
    await waitFor(() => {
      expect(status()).toBe('cookies_blocked');
    });
    await userEvent.click(screen.getByRole('button', { name: 'to-en' }));
    await waitFor(() => {
      expect(log).toContain('GET today?lang=en');
    });
    expect(patches).toHaveLength(0);
    expect(document.documentElement.lang).toBe('en');
  });

  it('TS-15 sin falso positivo por un today previo a la sesión', async () => {
    let todayCalls = 0;
    let releaseSession: () => void = () => undefined;
    const gate = new Promise<void>((r) => {
      releaseSession = r;
    });
    server.use(
      http.post('/api/session', async () => {
        await gate;
        return HttpResponse.json(sessionFixture);
      }),
      http.get('/api/today', () => {
        todayCalls += 1;
        return HttpResponse.json(todayCalls === 1 ? todayNoSessionFixture : todayFixture);
      }),
    );
    setup();
    await waitFor(() => {
      expect(todayCalls).toBe(1);
    });
    releaseSession();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(status()).toBe('active');
    expect(screen.getByTestId('can-play')).toHaveTextContent('true');
  });

  it('TS-16 el estado se recupera cuando la sesión se crea', async () => {
    server.use(http.get('/api/today', () => HttpResponse.json(todayNoSessionFixture)));
    setup();
    await waitFor(() => {
      expect(status()).toBe('cookies_blocked');
    });
    server.use(http.get('/api/today', () => HttpResponse.json(todayFixture)));
    await client.invalidateQueries({ queryKey: todayKeys.all });
    await waitFor(() => {
      expect(status()).toBe('active');
    });
  });

  it('TS-20 429 en la sesión: unavailable y sin reintento', async () => {
    track(() =>
      HttpResponse.json(
        { error: { code: 'rate_limited', message: 'Demasiadas solicitudes' } },
        { status: 429, headers: { 'Retry-After': '600' } },
      ),
    );
    setup();
    await waitFor(() => {
      expect(status()).toBe('unavailable');
    });
    expect(log.filter((l) => l === 'POST session')).toHaveLength(1);
    expect(screen.getByTestId('can-play')).toHaveTextContent('false');
  });

  it('TS-21 con 429 el selector funciona solo en cliente', async () => {
    const patches: unknown[] = [];
    server.use(
      patchOk(patches),
      http.post('/api/session', () =>
        HttpResponse.json({ error: { code: 'rate_limited', message: 'x' } }, { status: 429 }),
      ),
    );
    setup();
    await waitFor(() => {
      expect(status()).toBe('unavailable');
    });
    await userEvent.click(screen.getByRole('button', { name: 'to-en' }));
    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });
    expect(patches).toHaveLength(0);
    expect(document.documentElement.lang).toBe('en');
  });

  it.each([
    [
      '500',
      () => HttpResponse.json({ error: { code: 'internal_error', message: 'x' } }, { status: 500 }),
    ],
    ['red', () => HttpResponse.error()],
  ])('TS-22 %s en la sesión se degrada a unavailable', async (_name, reply) => {
    track(reply);
    setup();
    await waitFor(() => {
      expect(status()).toBe('unavailable');
    });
    expect(log.filter((l) => l === 'POST session')).toHaveLength(1);
  });

  it('TS-47 no escribe cookies ni almacenamiento', async () => {
    track();
    server.use(patchOk([]));
    setup();
    await waitFor(() => {
      expect(status()).toBe('active');
    });
    await userEvent.click(screen.getByRole('button', { name: 'to-en' }));
    await waitFor(() => {
      expect(screen.getByTestId('locale')).toHaveTextContent('en');
    });
    expect(document.cookie).toBe('');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('TS-50 useSession fuera del provider lanza', () => {
    expect(() => render(<Probe />)).toThrow('useSession must be used within SessionProvider');
  });
});
