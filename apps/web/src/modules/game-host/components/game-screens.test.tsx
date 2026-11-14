import { render, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeAll, describe, expect, it } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import i18n from '@/i18n';
import { SessionProvider } from '@/modules/session';
import { FB_DOCKER, FB_NOT_A_WORD } from '@/test/fixtures/grep-grid-today';
import { apiError, server } from '@/test/msw';

import type { GameView } from '../game-view';
import type { GameClient, GameProps, InstructionsProps, ResultProps } from '../types';

import { GameScreens } from './game-screens';
import type { GameScreensProps } from './game-screens';

const instructionsProps: InstructionsProps[] = [];
const gameProps: GameProps[] = [];
const resultProps: ResultProps[] = [];

const client: GameClient = {
  Instructions: (props) => {
    instructionsProps.push(props);
    return null;
  },
  Game: (props) => {
    gameProps.push(props);
    return null;
  },
  Result: (props) => {
    resultProps.push(props);
    return null;
  },
  share: () => '',
  i18n: { namespace: 'test', resources: { es: {}, en: {} } },
  HELP_TARGET_ID: 'game-help',
};

const noop = () => undefined;
const PV = { grid: [] };
const RESULT = { win: true };

function screens(view: GameScreensProps['view'], feedback: unknown) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <I18nextProvider i18n={i18n}>
        <SessionProvider>
          <MemoryRouter>
            <GameScreens
              client={client}
              gameId="grep-grid"
              view={view}
              feedback={feedback}
              locale="es"
              firstPhaseRef={{ current: true }}
              reportLink={<button type="button">report-link</button>}
              startNotice={null}
              starting={false}
              movePending={false}
              onStart={noop}
              onMove={noop}
              onRetrySession={noop}
              onRetryMove={noop}
              onRecoverMove={noop}
            />
          </MemoryRouter>
        </SessionProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

const instructions: Extract<GameView, { kind: 'instructions' }> = {
  kind: 'instructions',
  number: 128,
  dayChanged: false,
  session: 'ok',
  gameStats: null,
} as Extract<GameView, { kind: 'instructions' }>;

const playing: Extract<GameView, { kind: 'playing' }> = {
  kind: 'playing',
  number: 128,
  publicView: PV,
  state: {},
  locked: false,
  moveError: null,
  session: 'ok',
  moveFailed: false,
  gameStats: null,
  reported: false,
};

beforeAll(() => {
  i18n.addResourceBundle('es', 'test', {}, true, true);
});

describe('GameScreens', () => {
  it('TS-6: reenvía feedback tal cual (misma referencia)', () => {
    gameProps.length = 0;
    const { rerender } = render(screens(playing, null));
    expect(gameProps.at(-1)?.feedback).toBeNull();
    rerender(screens(playing, FB_DOCKER));
    expect(gameProps.at(-1)?.feedback).toBe(FB_DOCKER);
    rerender(screens({ ...playing }, FB_DOCKER));
    expect(gameProps.at(-1)?.feedback).toBe(FB_DOCKER);
    rerender(screens(playing, FB_NOT_A_WORD));
    expect(gameProps.at(-1)?.feedback).toBe(FB_NOT_A_WORD);
  });

  it('TS-7: pasa publicView al Result', () => {
    resultProps.length = 0;
    render(
      screens(
        {
          kind: 'result',
          number: 128,
          result: RESULT,
          publicView: PV,
          gameStats: null,
          reported: false,
        },
        null,
      ),
    );
    const props = resultProps.at(-1);
    expect(props?.publicView).toBe(PV);
    expect(props?.result).toBe(RESULT);
    // Rachas y salidas van juntas en el `footer`; el `aside` lleva el link de reporte (D5).
    expect(props?.aside).toBeDefined();
    expect(props?.footer).toBeDefined();
  });

  it('TS-4: pasa codeLanguage de la sesión a Instructions, Game y Result', async () => {
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json({ locale: 'es', preferred_code_language: 'go', created: false }),
      ),
    );
    instructionsProps.length = 0;
    gameProps.length = 0;
    resultProps.length = 0;
    const result: GameScreensProps['view'] = {
      kind: 'result',
      number: 128,
      result: RESULT,
      publicView: PV,
      gameStats: null,
      reported: false,
    };
    const a = render(screens(instructions, null));
    await waitFor(() => expect(instructionsProps.at(-1)?.codeLanguage).toBe('go'));
    a.unmount();
    const b = render(screens(playing, null));
    await waitFor(() => expect(gameProps.at(-1)?.codeLanguage).toBe('go'));
    b.unmount();
    render(screens(result, null));
    await waitFor(() => expect(resultProps.at(-1)?.codeLanguage).toBe('go'));
  });

  it('TS-5: sin preferencia cae a js', async () => {
    server.use(
      http.post('/api/session', () =>
        HttpResponse.json(apiError('internal_error', 'x'), { status: 500 }),
      ),
    );
    gameProps.length = 0;
    render(screens(playing, null));
    await new Promise((r) => setTimeout(r, 50));
    expect(gameProps.length).toBeGreaterThan(0);
    for (const p of gameProps) expect(p.codeLanguage).toBe('js');
  });
});
