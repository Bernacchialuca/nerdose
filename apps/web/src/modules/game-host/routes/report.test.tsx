import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';

import i18n from '@/i18n';
import {
  gameTodayInProgress,
  gameTodayNextDay,
  gameTodayVoidedPlay,
  gameTodayWon,
  reportCreated,
} from '@/test/fixtures/game-today';
import { grepGridInProgress3, grepGridWon } from '@/test/fixtures/grep-grid-today';
import { sessionFixture } from '@/test/fixtures/session';
import { timelineInProgress, timelineWon } from '@/test/fixtures/timeline-today';
import { countOf, errorResponse, h1, recordCalls } from '@/test/game-route-helpers';
import { gameHandlers, gameHandlersFor, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const REPORT_PATH = '/api/games/devdle/today/report?lang=es';
const SPOILER = 'No incluyas la respuesta si todavía estás jugando.';
const LINK = 'Reportar un problema';

const view = (route = '/devdle') => renderWithProviders({ route });
const dialog = () => screen.getByRole('dialog', { name: LINK });
const link = () => screen.getByRole('button', { name: LINK });

beforeEach(() => {
  server.use(gameHandlers.today(gameTodayInProgress));
});

afterEach(() => {
  server.events.removeAllListeners();
});

async function openDialog(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole('button', { name: LINK }));
  return screen.findByRole('dialog', { name: LINK });
}

async function fill(user: ReturnType<typeof userEvent.setup>, reason: string, message?: string) {
  await user.selectOptions(screen.getByRole('combobox', { name: /Elegí un motivo/ }), reason);
  if (message) await user.type(screen.getByRole('textbox', { name: /Contanos qué pasa/ }), message);
}

const send = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: /Enviar reporte/ }));

describe('link de reporte', () => {
  it('TS-1/TS-2: aparece en la partida y en el resultado de cada juego', async () => {
    const cases = [
      ['devdle', gameTodayInProgress, gameTodayWon],
      ['grep-grid', grepGridInProgress3, grepGridWon],
      ['timeline', timelineInProgress, timelineWon],
    ] as const;
    for (const [id, playing, done] of cases) {
      const handlers = gameHandlersFor(id);
      server.use(handlers.today(playing));
      const a = view(`/${id}`);
      const inGame = await screen.findByRole('button', { name: LINK });
      expect(inGame).not.toHaveAttribute('aria-disabled');
      // Debajo del client: el link es el último bloque de la partida (D5).
      expect(
        within(inGame.closest('main') as HTMLElement)
          .getAllByRole('button')
          .at(-1),
      ).toBe(inGame);
      a.unmount();
      server.use(handlers.today(done));
      const b = view(`/${id}`);
      const inResult = await screen.findByRole('button', { name: LINK });
      expect(inResult).toBeInTheDocument();
      b.unmount();
    }
  });

  it('TS-3: no hay link en carga ni en error', async () => {
    server.use(http.get('/api/games/devdle/today', () => new Promise(() => undefined)));
    const a = view();
    await screen.findByText(/cargando devdle/);
    expect(screen.queryByRole('button', { name: LINK })).toBeNull();
    a.unmount();
    server.use(
      http.get('/api/games/devdle/today', () =>
        HttpResponse.json({ error: { code: 'internal_error', message: 'x' } }, { status: 500 }),
      ),
    );
    view();
    await screen.findByRole('alert');
    expect(screen.queryByRole('button', { name: LINK })).toBeNull();
  });

  it('TS-4: reported:true lo deja deshabilitado y no abre el diálogo', async () => {
    const user = userEvent.setup();
    server.use(gameHandlers.today({ ...gameTodayWon, reported: true }));
    view();
    const btn = await screen.findByRole('button', { name: /Ya reportaste este desafío/ });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    expect(btn.querySelector('[aria-hidden="true"]')).toHaveTextContent('✓');
    await user.click(btn);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('partida bloqueada', () => {
  it('TS-25: tras challenge_voided el link sigue y abre con el aviso de spoilers', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/games/devdle/today/move', () =>
        errorResponse('challenge_voided', 'anulado', 409),
      ),
    );
    view();
    await screen.findByText(/intento 3 de 6/);
    await user.keyboard('QWERTY{Enter}');
    await screen.findByText(
      'Este desafío tenía un error y fue anulado. Tu racha no se ve afectada.',
    );
    expect(screen.queryByRole('group', { name: 'Teclado' })).toBeNull();
    await openDialog(user);
    expect(screen.getByText(SPOILER)).toBeInTheDocument();
  });
});

describe('abrir el diálogo', () => {
  it('TS-5: desde la partida muestra el aviso, el select vacío y el contador', async () => {
    const user = userEvent.setup();
    view();
    const d = await openDialog(user);
    expect(d).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { level: 2, name: LINK })).toBeInTheDocument();
    expect(screen.getByText('Devdle #128')).toBeInTheDocument();
    expect(screen.getByText(SPOILER)).toBeInTheDocument();
    expect(screen.getByText(SPOILER).closest('[role="status"]')).toBeNull();
    const select = screen.getByRole('combobox', { name: /Elegí un motivo/ });
    expect(select).toHaveFocus();
    expect(select).toHaveValue('');
    expect(Array.from((select as HTMLSelectElement).options).map((o) => o.textContent)).toEqual([
      'Sin elegir',
      'La respuesta es incorrecta',
      'Es ambiguo',
      'La explicación es incorrecta',
      'Problema de traducción',
      'Error de visualización',
      'Otro',
    ]);
    expect(screen.getByText('0 / 1000')).toBeInTheDocument();
    expect(screen.getByText('Un reporte por jugador y desafío')).toBeInTheDocument();
  });

  it('TS-6: desde el resultado no hay aviso de spoilers', async () => {
    const user = userEvent.setup();
    server.use(gameHandlers.today(gameTodayWon));
    view();
    await openDialog(user);
    expect(screen.queryByText(SPOILER)).toBeNull();
  });

  it('TS-7: desde el resultado anulado', async () => {
    const user = userEvent.setup();
    server.use(gameHandlers.today(gameTodayVoidedPlay));
    view();
    expect(await h1('Desafío anulado')).toBeInTheDocument();
    await openDialog(user);
    expect(screen.queryByText(SPOILER)).toBeNull();
    expect(screen.queryByRole('alertdialog')).toBeNull();
  });
});

describe('formulario', () => {
  it('TS-8: sin motivo muestra el error, enfoca el select y no envía', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    view();
    await openDialog(user);
    await send(user);
    expect(screen.getByText('Elegí un motivo para enviar el reporte.')).toBeInTheDocument();
    const select = screen.getByRole('combobox', { name: /Elegí un motivo/ });
    expect(select).toHaveAttribute('aria-invalid', 'true');
    expect(select).toHaveFocus();
    expect(countOf(calls, 'POST', REPORT_PATH)).toBe(0);
    await user.selectOptions(select, 'ambiguous');
    expect(screen.queryByText('Elegí un motivo para enviar el reporte.')).toBeNull();
  });

  it('TS-9: contador y aria-live pasado de 900', async () => {
    const user = userEvent.setup();
    view();
    await openDialog(user);
    const area = screen.getByRole('textbox', { name: /Contanos qué pasa/ });
    expect(area).toHaveAttribute('maxlength', '1000');
    await user.type(area, 'hola!');
    const counter = screen.getByText('5 / 1000');
    expect(counter).toHaveAttribute('aria-live', 'off');
    await user.clear(area);
    await user.click(area);
    await user.paste('a'.repeat(901));
    expect(screen.getByText('901 / 1000')).toHaveAttribute('aria-live', 'polite');
  });

  it('TS-22: cancelar no envía y devuelve el foco al link', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    view();
    await openDialog(user);
    await fill(user, 'other');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(countOf(calls, 'POST', REPORT_PATH)).toBe(0);
    expect(link()).toHaveFocus();
    expect(screen.getByText(/intento 3 de 6/)).toBeInTheDocument();
  });

  it('TS-23: Escape y el ícono cierran sin request', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    view();
    await openDialog(user);
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(link()).toHaveFocus();
    await openDialog(user);
    await user.click(screen.getByRole('button', { name: 'Cerrar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(link()).toHaveFocus();
    expect(countOf(calls, 'POST', REPORT_PATH)).toBe(0);
  });
});

describe('envío', () => {
  it('TS-10/TS-12: éxito, confirmación, cierre y link deshabilitado', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    server.use(gameHandlers.report(reportCreated, { status: 201 }));
    view();
    await openDialog(user);
    await fill(user, 'ambiguous', 'dos palabras posibles');
    await send(user);
    const status = await within(await screen.findByRole('dialog')).findByRole('status');
    expect(status).toHaveTextContent('Gracias, recibimos tu reporte.');
    expect(status).toHaveTextContent('Lo vamos a revisar.');
    expect(calls.find((c) => c.path === REPORT_PATH)?.body).toEqual({
      challenge_number: 128,
      reason: 'ambiguous',
      message: 'dos palabras posibles',
    });
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByRole('button', { name: /Enviar reporte/ })).toBeNull();
    const close = screen
      .getAllByRole('button', { name: 'Cerrar' })
      .find((b) => b.textContent === 'Cerrar');
    await waitFor(() => expect(close).toHaveFocus());
    await waitFor(() =>
      expect(countOf(calls, 'GET', '/api/games/devdle/today?lang=es')).toBeGreaterThanOrEqual(2),
    );
    expect(screen.getByText(/intento 3 de 6/)).toBeInTheDocument();
    await user.click(close as HTMLElement);
    expect(screen.queryByRole('dialog')).toBeNull();
    const after = screen.getByRole('button', { name: /Ya reportaste este desafío/ });
    expect(after).toHaveAttribute('aria-disabled', 'true');
    expect(after).toHaveFocus();
  });

  it('TS-11: un mensaje solo de espacios no viaja', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    server.use(gameHandlers.report(reportCreated, { status: 201 }));
    view();
    await openDialog(user);
    await fill(user, 'wrong_answer', '   ');
    await send(user);
    await within(await screen.findByRole('dialog')).findByRole('status');
    expect(calls.find((c) => c.path === REPORT_PATH)?.body).toEqual({
      challenge_number: 128,
      reason: 'wrong_answer',
    });
  });

  it('TS-13: already_reported se trata como confirmación', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/games/devdle/today/report', () =>
        errorResponse('already_reported', 'Ya reportaste este desafío.', 409),
      ),
    );
    view();
    await openDialog(user);
    await fill(user, 'other');
    await send(user);
    expect(
      await screen.findByText('Ya reportaste este desafío. Lo vamos a revisar.'),
    ).toBeVisible();
    expect(screen.queryByRole('alert')).toBeNull();
    await user.click(
      screen
        .getAllByRole('button', { name: 'Cerrar' })
        .find((b) => b.textContent === 'Cerrar') as HTMLElement,
    );
    expect(screen.getByRole('button', { name: /Ya reportaste este desafío/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
  });

  it('TS-14: invalid_report marca el textarea y conserva los valores', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/games/devdle/today/report', () =>
        errorResponse('invalid_report', 'Reporte inválido.', 422),
      ),
    );
    view();
    await openDialog(user);
    await fill(user, 'translation', 'x');
    await send(user);
    const area = await screen.findByRole('textbox', { name: /Contanos qué pasa/ });
    await waitFor(() => expect(area).toHaveAttribute('aria-invalid', 'true'));
    expect(area).toHaveAccessibleDescription(/El mensaje puede tener hasta 1000 caracteres\./);
    expect(area).toHaveValue('x');
    expect(screen.getByRole('combobox', { name: /Elegí un motivo/ })).toHaveValue('translation');
    expect(screen.queryByText('Reporte inválido.')).toBeNull();
    expect(screen.getByRole('button', { name: /Enviar reporte/ })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('TS-15: rate_limited muestra el límite y conserva los campos', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/games/devdle/today/report', () =>
        errorResponse('rate_limited', 'Demasiadas solicitudes.', 429, { 'Retry-After': '3600' }),
      ),
    );
    view();
    await openDialog(user);
    await fill(user, 'display_bug', 'se corta');
    await send(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Se enviaron muchos reportes desde esta conexión. Probá de nuevo más tarde.',
    );
    expect(screen.getByRole('textbox', { name: /Contanos qué pasa/ })).toHaveValue('se corta');
    expect(screen.queryByText('Demasiadas solicitudes.')).toBeNull();
  });

  it('TS-16: falla de red y reintento', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    let n = 0;
    server.use(
      http.post('/api/games/devdle/today/report', () => {
        n += 1;
        return n === 1 ? HttpResponse.error() : HttpResponse.json(reportCreated, { status: 201 });
      }),
    );
    view();
    await openDialog(user);
    await fill(user, 'wrong_answer', 'falta la Ñ');
    await send(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos enviar el reporte. Probá de nuevo.',
    );
    expect(screen.getByRole('textbox', { name: /Contanos qué pasa/ })).toHaveValue('falta la Ñ');
    await send(user);
    expect(await within(await screen.findByRole('dialog')).findByRole('status')).toHaveTextContent(
      'Gracias',
    );
    expect(screen.queryByRole('alert')).toBeNull();
    expect(countOf(calls, 'POST', REPORT_PATH)).toBe(2);
  });

  it.each([
    ['internal_error', 500],
    ['not_found', 404],
  ])('TS-17/18: %s muestra la alerta de sistema', async (code, status) => {
    const user = userEvent.setup();
    server.use(http.post('/api/games/devdle/today/report', () => errorResponse(code, 'x', status)));
    view();
    await openDialog(user);
    await fill(user, 'other');
    await send(user);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No pudimos enviar el reporte. Probá de nuevo.',
    );
  });

  it('TS-19: no_session se recupera una vez', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    let n = 0;
    server.use(
      http.post('/api/games/devdle/today/report', () => {
        n += 1;
        return n === 1
          ? errorResponse('no_session', 'x', 401)
          : HttpResponse.json(reportCreated, { status: 201 });
      }),
      http.post('/api/session', () => HttpResponse.json(sessionFixture)),
    );
    view();
    await openDialog(user);
    await fill(user, 'other');
    const before = calls.length;
    await send(user);
    await within(await screen.findByRole('dialog')).findByRole('status');
    const after = calls.slice(before).filter((c) => c.method === 'POST');
    expect(after.map((c) => c.path)).toEqual([REPORT_PATH, '/api/session', REPORT_PATH]);
  });

  it('TS-20: no_session persistente muestra la alerta tras un solo reintento', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    server.use(
      http.post('/api/games/devdle/today/report', () => errorResponse('no_session', 'x', 401)),
      http.post('/api/session', () => HttpResponse.json(sessionFixture)),
    );
    view();
    await openDialog(user);
    await fill(user, 'other');
    const before = calls.length;
    await send(user);
    expect(await screen.findByRole('alert')).toHaveTextContent('No pudimos enviar el reporte.');
    const after = calls.slice(before);
    expect(countOf(after, 'POST', '/api/session')).toBe(1);
    expect(countOf(after, 'POST', REPORT_PATH)).toBe(2);
  });

  it('TS-21: enviando bloquea el botón, Escape y el cierre', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    server.use(
      http.post('/api/games/devdle/today/report', async () => {
        await gate;
        return HttpResponse.json(reportCreated, { status: 201 });
      }),
    );
    view();
    await openDialog(user);
    await fill(user, 'other');
    await send(user);
    const btn = await screen.findByRole('button', { name: 'Enviando…' });
    expect(btn).toHaveAttribute('aria-disabled', 'true');
    await user.click(btn);
    await user.keyboard('{Escape}');
    expect(dialog()).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveAttribute('aria-disabled', 'true');
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(dialog()).toBeInTheDocument();
    expect(countOf(calls, 'POST', REPORT_PATH)).toBe(1);
    await act(async () => release());
    expect(
      await within(await screen.findByRole('dialog')).findByRole('status'),
    ).toBeInTheDocument();
  });

  it('TS-24: con el día cambiado el reporte lleva el desafío visto', async () => {
    const user = userEvent.setup();
    const calls = recordCalls();
    server.use(
      gameHandlers.today(gameTodayWon),
      gameHandlers.report(reportCreated, { status: 201 }),
    );
    const { queryClient } = view();
    await openDialog(user);
    server.use(gameHandlers.today(gameTodayNextDay));
    await act(() => queryClient.invalidateQueries({ queryKey: ['game-today'] }));
    // La pantalla de atrás pasó a instrucciones del #129; el diálogo sigue abierto (D1).
    expect(await screen.findByRole('button', { name: /Empezar/ })).toBeInTheDocument();
    expect(dialog()).toBeInTheDocument();
    await fill(user, 'wrong_answer');
    await send(user);
    await within(await screen.findByRole('dialog')).findByRole('status');
    expect(calls.find((c) => c.path === REPORT_PATH)?.body).toMatchObject({
      challenge_number: 128,
      reason: 'wrong_answer',
    });
  });
});

describe('accesibilidad e inglés', () => {
  it('TS-26: axe sin violaciones con aviso y con error de campo; Tab queda dentro', async () => {
    const user = userEvent.setup();
    server.use(
      http.post('/api/games/devdle/today/report', () =>
        errorResponse('invalid_report', 'Reporte inválido.', 422),
      ),
    );
    const { container } = view();
    await openDialog(user);
    expect(await axe(container)).toHaveNoViolations();
    await fill(user, 'other', 'x');
    await send(user);
    await screen.findByText('El mensaje puede tener hasta 1000 caracteres.');
    expect(await axe(container)).toHaveNoViolations();
    const d = dialog();
    for (let i = 0; i < 8; i += 1) {
      await user.tab();
      expect(d.contains(document.activeElement)).toBe(true);
    }
  });

  it('TS-43: textos en inglés', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('en');
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
    );
    server.use(http.get('/api/games/devdle/today', () => HttpResponse.json(gameTodayInProgress)));
    view();
    await user.click(await screen.findByRole('button', { name: 'Report a problem' }));
    expect(await screen.findByRole('dialog', { name: 'Report a problem' })).toBeInTheDocument();
    expect(
      screen.getByText("Don't include the answer if you're still playing."),
    ).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /Choose a reason/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'The answer is wrong' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send report/ })).toBeInTheDocument();
  });
});

describe('O-01 · sheet, descripción y fondo inerte (S-034/ui)', () => {
  it('TS-15: desde la partida usa sheet y se describe por el aviso', async () => {
    const user = userEvent.setup();
    view();
    const d = await openDialog(user);
    expect(d).toHaveClass('rounded-t-panel', 'sm:rounded-panel');
    expect(d).toHaveAccessibleDescription(SPOILER);
    expect(screen.getByRole('combobox', { name: /Elegí un motivo/ })).toHaveFocus();
  });

  it('TS-16: desde el resultado es sheet sin descripción', async () => {
    const user = userEvent.setup();
    server.use(gameHandlers.today(gameTodayWon));
    view();
    const d = await openDialog(user);
    expect(d).toHaveClass('rounded-t-panel');
    expect(d).not.toHaveAttribute('aria-describedby');
    expect(screen.queryByText(SPOILER)).toBeNull();
  });

  it('TS-17: el fondo queda inerte y el foco vuelve al link', async () => {
    const user = userEvent.setup();
    view();
    await openDialog(user);
    expect(document.querySelector('header')?.closest('[inert]')).not.toBeNull();
    expect(
      screen.getByRole('button', { name: LINK, hidden: true }).closest('[inert]'),
    ).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.querySelector('[inert]')).toBeNull();
    expect(link()).toHaveFocus();
  });

  it('TS-19: descripción en inglés', async () => {
    const user = userEvent.setup();
    await i18n.changeLanguage('en');
    server.use(
      http.post('/api/session', () => HttpResponse.json({ ...sessionFixture, locale: 'en' })),
      http.get('/api/games/devdle/today', () => HttpResponse.json(gameTodayInProgress)),
    );
    view();
    await user.click(await screen.findByRole('button', { name: 'Report a problem' }));
    const d = await screen.findByRole('dialog', { name: 'Report a problem' });
    expect(d).toHaveAccessibleDescription("Don't include the answer if you're still playing.");
  });
});
