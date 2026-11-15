import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { SESSION } from '@/test/fixtures/reports';
import {
  UPCOMING_BAD_PAYLOAD,
  UPCOMING_BIG_O,
  UPCOMING_BIG_O_BAD_PAYLOAD,
  UPCOMING_BUG_HUNT,
  UPCOMING_BUG_HUNT_BAD_PAYLOAD,
  UPCOMING_OK,
  UPCOMING_PENDING,
  UPCOMING_REGEN_FAILED,
  UPCOMING_REJECTED_ITEM,
  UPCOMING_REPLACED,
  upcoming,
} from '@/test/fixtures/upcoming';
import { useUpcomingClock } from '@/test/helpers';
import { adminHandlers, requests, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const render = () => renderWithProviders({ route: '/upcoming', session: SESSION });

async function openCell(
  user: ReturnType<typeof render>['user'],
  rowName: string,
  column: string,
): Promise<HTMLElement> {
  await screen.findByRole('table');
  const row = screen.getByRole('rowheader', { name: rowName }).closest('tr');
  const headers = screen.getAllByRole('columnheader').map((h) => h.textContent);
  const cell = within(row as HTMLElement).getAllByRole('cell')[headers.indexOf(column) - 1];
  await user.click(
    within(cell as HTMLElement).getByRole('button', { name: /, \d{4}-\d{2}-\d{2}/ }),
  );
  return screen.findByRole('dialog');
}

const previewReady = (dialog: HTMLElement) =>
  waitFor(() => {
    expect(dialog.querySelector('[lang="en"]')).not.toBeNull();
    expect(dialog.querySelector('[lang="es"]')).not.toBeNull();
  });

describe('drawer O-02 desde Próximos', () => {
  it('Grep Grid: chips, datos, paneles ES/EN y log, sin seed ni acciones de Reportes (TS-28, TS-54)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openCell(user, '05/12 #35', 'Grep Grid');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Grep Grid #35' })).toBeVisible();
    for (const chip of ['Grep Grid', '#35', '2026-12-05', 'aprobado']) {
      expect(within(dialog).getAllByText(chip).length).toBeGreaterThan(0);
    }
    expect(within(dialog).getByText('Intento 0 · generator 1.4.0')).toBeInTheDocument();
    await previewReady(dialog);
    const es = within(dialog).getByRole('region', { name: 'ES' });
    const en = within(dialog).getByRole('region', { name: 'EN' });
    expect(es.parentElement).toHaveClass('lg:grid-cols-2');
    expect(en.parentElement).toBe(es.parentElement);
    expect(await within(es).findByText(/definición de REDIS/)).toBeInTheDocument();
    expect(await within(en).findByText(/definition of REDIS/)).toBeInTheDocument();
    expect(es.querySelector('[lang="es"]')).not.toBeNull();
    expect(en.querySelector('[lang="en"]')).not.toBeNull();
    expect(within(dialog).getByRole('heading', { name: 'Datos del desafío' })).toBeInTheDocument();
    expect(
      within(dialog).getByRole('heading', { name: 'Log de verificación' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(/solution_verified/)).toBeInTheDocument();
    expect(dialog.textContent).not.toMatch(/seed/i);
    for (const word of ['Reportes', 'Resolver', 'Descartar', 'Anular desafío']) {
      expect(within(dialog).queryByText(word)).toBeNull();
    }
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('Devdle: palabra, definición y resumen en ES y EN (TS-29)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Devdle');
    await previewReady(dialog);
    const es = within(dialog).getByRole('region', { name: 'ES' });
    const en = within(dialog).getByRole('region', { name: 'EN' });
    expect(
      await within(es).findByText(/biblioteca de JavaScript para construir interfaces de usuario/),
    ).toBeInTheDocument();
    expect(
      within(es).getByText(/React es una biblioteca de código abierto mantenida por Meta\./),
    ).toBeInTheDocument();
    expect(within(es).getAllByText(/REACT/).length).toBeGreaterThan(0);
    expect(
      await within(en).findByText(/JavaScript library for building user interfaces/),
    ).toBeInTheDocument();
  });

  it('Timeline: consigna y 5 hechos en el orden correcto (TS-30)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    const dialog = await openCell(user, '05/12 #35', 'Tech Timeline');
    await previewReady(dialog);
    const es = within(dialog).getByRole('region', { name: 'ES' });
    const en = within(dialog).getByRole('region', { name: 'EN' });
    expect(
      await within(es).findByText(/Ordená estos hitos del más antiguo al más reciente/),
    ).toBeInTheDocument();
    const labels = ['Python', 'Java', 'Go', 'Docker', 'Kubernetes'];
    const positions = labels.map((l) => es.textContent?.indexOf(`nota de ${l}`) ?? -1);
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
    expect(
      await within(en).findByText(/Order these milestones from oldest to newest/),
    ).toBeInTheDocument();
    expect(within(en).getByText(/note on Python/)).toBeInTheDocument();
  });

  it('un payload inválido muestra aviso y la vista genérica sin cerrar el detalle (TS-32)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(adminHandlers.upcoming(UPCOMING_BAD_PAYLOAD));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Devdle');
    expect(
      await within(dialog).findByText(
        'No pudimos mostrar la preview del juego. Mostramos los datos del desafío.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: 'ES' })).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: 'Datos del desafío' })).toHaveTextContent(
      'redis',
    );
    expect(
      within(dialog).getByRole('heading', { name: 'Log de verificación' }),
    ).toBeInTheDocument();
    // React también registra el error capturado; el del boundary es el que llega solo, como Error.
    expect(
      spy.mock.calls.filter(([only, ...rest]) => only instanceof Error && rest.length === 0),
    ).toHaveLength(1);
    spy.mockRestore();
  });

  it('el detalle nunca muestra el seed aunque la verificación traiga reason indefinido (TS-54)', async () => {
    const base = upcoming();
    const game = base.days[0]?.games[0];
    if (game?.challenge) {
      game.challenge.verification = {
        ok: true,
        checks: [{ name: 'solution_verified', ok: true }],
        reason: undefined,
      };
    }
    server.use(adminHandlers.upcoming(base));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Devdle');
    await previewReady(dialog);
    expect(dialog.textContent).not.toMatch(/seed/i);
  });

  it('sub-estados: pendiente, fallida e ítem rechazado (TS-33)', async () => {
    useUpcomingClock();
    server.use(adminHandlers.upcoming(UPCOMING_PENDING));
    const first = render();
    let dialog = await openCell(first.user, '05/12 #35', 'Grep Grid');
    expect(within(dialog).getByText('regenerando…')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Regeneración pendiente desde las 14:02. Mientras tanto este desafío sigue aprobado y se publica tal cual si llega su fecha.',
      ),
    ).toBeInTheDocument();
    const pending = within(dialog).getByRole('button', { name: 'Regenerando…' });
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    await first.user.click(pending);
    expect(screen.queryByRole('dialog', { name: 'Regenerar desafío' })).toBeNull();
    first.unmount();

    server.use(adminHandlers.upcoming(UPCOMING_REGEN_FAILED));
    const second = render();
    dialog = await openCell(second.user, '05/12 #35', 'Grep Grid');
    expect(within(dialog).getByText('regeneración fallida')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'La última regeneración falló a las 14:05: ningún reemplazo pasó la verificación (overlap_conflict). Queda este desafío.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
    second.unmount();

    server.use(adminHandlers.upcoming(UPCOMING_REJECTED_ITEM));
    const third = render();
    dialog = await openCell(third.user, '05/12 #35', 'Devdle');
    expect(within(dialog).getByText('usa un ítem rechazado')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Este desafío usa un ítem rechazado: CAP theorem (definición incorrecta). No se regenera solo: regeneralo si no querés publicarlo.',
      ),
    ).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('varios ítems rechazados se listan uno por línea (D15)', async () => {
    const base = upcoming();
    const game = base.days[0]?.games[0];
    if (game?.challenge) {
      game.challenge.rejected_items = [
        { kind: 'term', id: 'a', label: 'CAP theorem', rejection_reason: 'definición incorrecta' },
        { kind: 'term', id: 'b', label: 'ACID', rejection_reason: 'ambiguo' },
      ];
    }
    server.use(adminHandlers.upcoming(base));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Devdle');
    expect(
      within(dialog).getByText(
        'Este desafío usa ítems rechazados. No se regenera solo: regeneralo si no querés publicarlo.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('CAP theorem (definición incorrecta)')).toBeInTheDocument();
    expect(within(dialog).getByText('ACID (ambiguo)')).toBeInTheDocument();
  });

  it('se actualiza con el polling cuando llega el reemplazo (TS-34)', async () => {
    useUpcomingClock();
    server.use(adminHandlers.upcomingSequence([UPCOMING_PENDING, UPCOMING_REPLACED]));
    const { user } = render();
    const dialog = await openCell(user, '05/12 #35', 'Grep Grid');
    expect(within(dialog).getByText('Intento 0 · generator 1.4.0')).toBeInTheDocument();
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(within(dialog).getByText('Intento 3 · generator 1.4.0')).toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(within(dialog).queryByText(/Regeneración pendiente/)).toBeNull();
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
    vi.useRealTimers();
  });

  it('se cierra solo si el día sale de la ventana y el foco va al h1 (TS-35)', async () => {
    useUpcomingClock();
    server.use(
      adminHandlers.upcomingSequence([
        UPCOMING_PENDING,
        upcoming({}, { from: '2026-12-03', firstNumber: 33 }),
      ]),
    );
    const { user } = render();
    await openCell(user, '02/12 #32', 'Devdle');
    await vi.advanceTimersByTimeAsync(5_000);
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).toBeNull();
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Próximos desafíos' })).toHaveFocus();
    vi.useRealTimers();
  });

  it('Escape cierra y devuelve el foco al botón de la celda (TS-36)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_OK));
    const { user } = render();
    await openCell(user, '03/12 #33', 'Devdle');
    const opener = screen.getByRole('button', { name: /Devdle #33, 2026-12-03/ });
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(opener).toHaveFocus();
  });
});

describe('Big O desde Próximos (S-046)', () => {
  const open = async () => {
    server.use(adminHandlers.upcoming(UPCOMING_BIG_O));
    const view = render();
    const dialog = await openCell(view.user, '02/12 #32', 'Big O');
    await previewReady(dialog);
    const ES = within(dialog).getByRole('region', { name: 'ES' });
    const EN = within(dialog).getByRole('region', { name: 'EN' });
    return { ...view, dialog, ES, EN };
  };

  it('cabecera, chips y datos de generación (TS-7)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_BIG_O));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Big O');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Big O #32' })).toBeVisible();
    for (const chip of ['Big O', '#32', '2026-12-02', 'aprobado']) {
      expect(within(dialog).getAllByText(chip).length).toBeGreaterThan(0);
    }
    expect(within(dialog).getByText('Intento 0 · generator 1.4.0')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('preview ES con código en texto plano y pestañas (TS-8)', async () => {
    const { ES } = await open();
    expect(ES.querySelector('[lang="es"]')).not.toBeNull();
    expect(ES).toHaveTextContent('¿Cuál es la complejidad temporal (peor caso) de f(n)?');
    expect(within(ES).getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(ES).getByRole('tab', { name: 'Go' })).toHaveAttribute('aria-selected', 'false');
    expect(within(ES).getByRole('tab', { name: 'Java' })).toHaveAttribute('aria-selected', 'false');
    const panel = within(ES).getByRole('tabpanel', { name: 'Código de f(n) en JavaScript' });
    expect(panel).toHaveTextContent('for (let i = 0; i < n; i++) {');
    expect(panel).toHaveTextContent('n veces');
    expect(panel).toHaveTextContent('log n veces');
    const colored = [...panel.querySelectorAll('span')].filter((sp) => sp.style.color);
    expect(colored).toHaveLength(0);
    expect(within(ES).queryByText('Cargando preview…')).toBeNull();
  });

  it('respuesta y trampa marcadas con texto (TS-9)', async () => {
    const { ES } = await open();
    expect(within(ES).getByRole('heading', { level: 3, name: 'respuesta' })).toBeInTheDocument();
    const list = within(ES).getByRole('list', { name: 'respuesta' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(8);
    const correct = within(list).getByText('O(n log n), correcta').closest('li') as HTMLElement;
    expect(correct).toHaveTextContent('correcta');
    const trap = within(list).getByText('O(n²), trampa').closest('li') as HTMLElement;
    expect(trap).toHaveTextContent('trampa');
    for (const item of within(list).getAllByRole('listitem')) {
      expect(item).not.toHaveTextContent('tu respuesta');
    }
  });

  it('explicación ES: pasos, en números, consejo (TS-10)', async () => {
    const { ES } = await open();
    const steps = within(ES).getByRole('region', { name: 'Paso a paso' });
    const items = within(within(steps).getByRole('list')).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('El loop externo corre n veces.');
    expect(ES).toHaveTextContent('// en números, con n = 1024');
    expect(ES).toHaveTextContent('f(1024) cuenta 10.240 operaciones');
    expect(ES).toHaveTextContent('con O(n²) serían 1.048.576');
    expect(ES).toHaveTextContent('Un loop interno que duplica su variable no es n.');
  });

  it('preview EN equivalente en inglés y mismo código (TS-11)', async () => {
    const { ES, EN } = await open();
    expect(EN.querySelector('[lang="en"]')).not.toBeNull();
    expect(EN).toHaveTextContent('What is the time complexity (worst case) of f(n)?');
    expect(within(EN).getByRole('heading', { level: 3, name: 'answer' })).toBeInTheDocument();
    expect(within(EN).getByRole('region', { name: 'Step by step' })).toBeInTheDocument();
    expect(within(EN).getByText('O(n log n), correct')).toBeInTheDocument();
    expect(within(EN).getByText('O(n²), trap')).toBeInTheDocument();
    for (const t of [
      'n times',
      'log n times',
      'The outer loop runs n times.',
      'with O(n²) it would be 1,048,576',
      'An inner loop that doubles its variable is not n.',
    ]) {
      expect(EN).toHaveTextContent(t);
    }
    const enCode = within(EN).getByRole('tabpanel', { name: 'Code of f(n) in JavaScript' });
    const esCode = within(ES).getByRole('tabpanel', { name: 'Código de f(n) en JavaScript' });
    const norm = (t: string | null) => (t ?? '').replace(/\s+/g, '');
    expect(norm((enCode.textContent ?? '').replace(/log n times|n times/g, ''))).toBe(
      norm((esCode.textContent ?? '').replace(/log n veces|n veces/g, '')),
    );
    for (const es of ['Paso a paso', 'trampa', 'correcta']) {
      expect(EN).not.toHaveTextContent(es);
    }
  });

  it('columnas lado a lado, ES antes que EN (TS-12)', async () => {
    const { ES, EN } = await open();
    expect(ES.parentElement).toHaveClass('lg:grid-cols-2');
    expect(EN.parentElement).toBe(ES.parentElement);
    expect(ES.compareDocumentPosition(EN) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('jerarquía de encabezados del preview (TS-13)', async () => {
    const { ES, EN } = await open();
    for (const col of [ES, EN]) {
      expect(within(col).queryAllByRole('heading', { level: 1 })).toHaveLength(0);
      expect(within(col).queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    }
    expect(within(ES).getByRole('heading', { level: 3, name: 'ES' })).toBeInTheDocument();
    expect(within(EN).getByRole('heading', { level: 3, name: 'EN' })).toBeInTheDocument();
  });

  it('pestañas independientes y sin efectos (TS-14)', async () => {
    const { user, ES, EN } = await open();
    await user.click(within(ES).getByRole('tab', { name: 'Go' }));
    expect(within(ES).getByRole('tab', { name: 'Go' })).toHaveAttribute('aria-selected', 'true');
    const panel = within(ES).getByRole('tabpanel', { name: 'Código de f(n) en Go' });
    expect(panel).toHaveTextContent('func f(n int) int {');
    expect(panel).toHaveTextContent('n veces');
    expect(within(EN).getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(EN).getByRole('tabpanel', { name: 'Code of f(n) in JavaScript' })).toBeVisible();
    expect(requests.filter((r) => r.pathname !== '/api/admin/challenges/upcoming')).toHaveLength(0);
  });

  it('pestañas con teclado (TS-15)', async () => {
    const { user, ES, EN } = await open();
    await user.click(within(EN).getByRole('tab', { name: 'JavaScript' }));
    await user.keyboard('{ArrowRight}');
    const go = within(EN).getByRole('tab', { name: 'Go' });
    expect(go).toHaveFocus();
    expect(go).toHaveAttribute('aria-selected', 'true');
    expect(within(EN).getByRole('tabpanel', { name: 'Code of f(n) in Go' })).toBeVisible();
    await user.keyboard('{ArrowLeft}');
    expect(within(EN).getByRole('tab', { name: 'JavaScript' })).toHaveFocus();
    expect(within(ES).getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('datos del desafío genéricos (TS-16)', async () => {
    const { dialog, ES } = await open();
    const common = within(dialog).getByRole('region', { name: 'Datos del desafío' });
    for (const [k, v] of [
      ['recipe', 'nest(linear,doubling)'],
      ['recipe_category', 'nested_loops'],
      ['answer', 'o_n_log_n'],
      ['trap_option', 'o_n2'],
      ['explanation.example.n', '1024'],
    ]) {
      expect(common).toHaveTextContent(k as string);
      expect(common).toHaveTextContent(v as string);
    }
    expect(dialog.textContent).not.toContain('Culpables posibles');
    expect(ES.querySelector('dt')).toBeNull();
    expect(ES).not.toHaveTextContent('explanation.steps.0');
  });

  it('log de verificación genérico con los checks de Big O (TS-17)', async () => {
    const { dialog } = await open();
    const log = within(dialog).getByRole('region', { name: 'Log de verificación' });
    const items = within(log).getAllByRole('listitem');
    expect(items).toHaveLength(13);
    const names = [
      'texts_bilingual',
      'code_shape',
      'variety_recipe',
      'variety_answer',
      'run_js',
      'run_go',
      'run_java',
      'counts_agree',
      'counts_in_range',
      'example_matches_run',
      'fit_quality',
      'fit_unambiguous',
      'fit_matches_answer',
    ];
    names.forEach((n, i) => expect(items[i]).toHaveTextContent(n));
    expect(log).toHaveTextContent(/run_go\s*·\s*310 ms/);
    expect(log).toHaveTextContent(/example_matches_run\s*·\s*n=1024 ops=10240/);
    expect(log).toHaveTextContent(/fit_matches_answer\s*·\s*best=o_n_log_n answer=o_n_log_n/);
    expect(within(log).getAllByText(/verificación correcta/).length).toBeGreaterThan(0);
    expect(dialog.textContent).not.toMatch(/seed/i);
  });

  it('payload de Big O inválido: aviso y vista genérica (TS-18)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(adminHandlers.upcoming(UPCOMING_BIG_O_BAD_PAYLOAD));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Big O');
    expect(
      await within(dialog).findByText(
        'No pudimos mostrar la preview del juego. Mostramos los datos del desafío.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: 'ES' })).toHaveTextContent(
      'El loop externo corre n veces.',
    );
    expect(within(dialog).getByRole('region', { name: 'EN' })).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: 'Datos del desafío' })).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: 'Log de verificación' })).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(
      spy.mock.calls.filter(([only, ...rest]) => only instanceof Error && rest.length === 0),
    ).toHaveLength(1);
    spy.mockRestore();
  });

  it('el admin queda en español y solo el panel EN declara inglés (TS-21)', async () => {
    const lang = document.documentElement.lang;
    const { dialog, ES, EN } = await open();
    expect(document.documentElement.lang).toBe(lang);
    const en = dialog.querySelectorAll('[lang="en"]');
    const es = dialog.querySelectorAll('[lang="es"]');
    expect(en).toHaveLength(1);
    expect(EN.contains(en[0] as Element)).toBe(true);
    expect(es).toHaveLength(1);
    expect(ES.contains(es[0] as Element)).toBe(true);
  });

  it('Escape cierra el drawer de Big O y devuelve el foco (TS-23)', async () => {
    const { user } = await open();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: /Big O #32, 2026-12-02/ })).toHaveFocus();
  });
});

describe('Bug Hunt desde Próximos (S-051)', () => {
  const open = async () => {
    server.use(adminHandlers.upcoming(UPCOMING_BUG_HUNT));
    const view = render();
    const dialog = await openCell(view.user, '02/12 #32', 'Bug Hunt');
    await previewReady(dialog);
    const ES = within(dialog).getByRole('region', { name: 'ES' });
    const EN = within(dialog).getByRole('region', { name: 'EN' });
    return { ...view, dialog, ES, EN };
  };
  const codeES = (ES: HTMLElement) =>
    within(ES).getByRole('tabpanel', { name: 'Código de maxIndex en JavaScript' });
  const norm = (t: string | null) => (t ?? '').replace(/\s+/g, '');

  it('cabecera, chips y datos de generación (TS-8)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_BUG_HUNT));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Bug Hunt');
    expect(within(dialog).getByRole('heading', { level: 2, name: 'Bug Hunt #32' })).toBeVisible();
    for (const chip of ['Bug Hunt', '#32', '2026-12-02', 'aprobado']) {
      expect(within(dialog).getAllByText(chip).length).toBeGreaterThan(0);
    }
    expect(within(dialog).getByText('Intento 0 · generator 1.4.0')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).not.toHaveAttribute(
      'aria-disabled',
    );
  });

  it('preview ES: especificación y código en texto plano con pestañas (TS-9)', async () => {
    const { ES } = await open();
    expect(ES.querySelector('[lang="es"]')).not.toBeNull();
    expect(
      within(ES).getByRole('heading', { level: 3, name: 'qué debería hacer' }),
    ).toBeInTheDocument();
    expect(
      within(ES).getByText(
        'Devuelve el índice del mayor valor de nums; si el máximo se repite, el del primero. Con nums vacío devuelve 0.',
      ),
    ).toBeInTheDocument();
    expect(within(ES).getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(ES).getByRole('tab', { name: 'Go' })).toHaveAttribute('aria-selected', 'false');
    expect(within(ES).getByRole('tab', { name: 'Java' })).toHaveAttribute('aria-selected', 'false');
    expect(ES).toHaveTextContent('max-index.js');
    const code = codeES(ES);
    expect(code).toHaveTextContent('function maxIndex(nums) {');
    expect(code).toHaveTextContent('if (nums[i] >= nums[best]) {');
    expect([...code.querySelectorAll('span')].filter((sp) => sp.style.color)).toHaveLength(0);
    expect(within(ES).queryByText('Cargando preview…')).toBeNull();
  });

  it('preview ES: línea del bug marcada con texto y no elegibles atenuadas (TS-10)', async () => {
    const { ES } = await open();
    const rows = [...codeES(ES).children] as HTMLElement[];
    expect(rows).toHaveLength(9);
    const bug = rows[3] as HTMLElement;
    expect(bug).toHaveTextContent('if (nums[i] >= nums[best]) {');
    expect(bug).toHaveTextContent('línea del bug');
    expect(bug).toHaveAccessibleDescription(/línea del bug/);
    expect(bug).not.toHaveClass('text-text-dim');
    for (const i of [0, 5, 6, 8]) expect(rows[i]).toHaveClass('text-text-dim');
    expect(rows[1]).not.toHaveClass('text-text-dim');
    expect(codeES(ES).querySelectorAll('[aria-describedby]')).toHaveLength(1);
    expect(within(ES).queryAllByRole('radio')).toHaveLength(0);
    expect(within(ES).queryAllByRole('radiogroup')).toHaveLength(0);
  });

  it('preview ES: chips y tests visibles sin el oculto (TS-11)', async () => {
    const { ES } = await open();
    expect(within(ES).getByText('tipo: comparación')).toBeInTheDocument();
    expect(within(ES).getByText('mutación: > → >=')).toBeInTheDocument();
    // Embebidos en la columna, los bloques del preview no son landmarks: se ubican por su h3.
    const testsHeading = within(ES).getByRole('heading', { level: 3, name: 'tests' });
    const tests = testsHeading.parentElement?.parentElement as HTMLElement;
    expect(within(tests).getAllByRole('listitem')).toHaveLength(3);
    for (const t of ['maxIndex([]) → 0', 'maxIndex([4]) → 0', 'maxIndex([3, 7, 2]) → 1']) {
      expect(within(tests).getByText(t)).toBeInTheDocument();
    }
    expect(tests).toHaveTextContent('maxIndex de [3, 7, 2] da 1, pasa');
    expect(ES).not.toHaveTextContent('1 test oculto falla');
    expect(ES).not.toHaveTextContent('El test que falla se revela al confirmar.');
  });

  it('preview ES: test que falla, fix y «Por qué falla» (TS-12)', async () => {
    const { ES } = await open();
    const failing = within(ES).getByRole('heading', { level: 3, name: 'el test que falla' })
      .parentElement as HTMLElement;
    expect(failing).toHaveTextContent('maxIndex([5, 1, 5])');
    expect(failing).toHaveTextContent('esperado 0 · obtenido 2');
    expect(
      within(ES).getByRole('heading', { level: 3, name: /el fix · línea 4/ }),
    ).toBeInTheDocument();
    const fix = within(ES).getByRole('region', { name: 'Fix de la línea 4 en JavaScript' });
    expect(fix).toHaveTextContent('if (nums[i] >= nums[best]) {');
    expect(fix).toHaveTextContent('if (nums[i] > nums[best]) {');
    const why = within(ES).getByRole('heading', { level: 3, name: 'Por qué falla' });
    const items = within(why.parentElement as HTMLElement).getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent(
      'La condición que decide si best cambia usa >= en lugar de >: con un empate también se mueve.',
    );
  });

  it('preview EN equivalente en inglés con el mismo código, tests y fix (TS-13)', async () => {
    const { ES, EN } = await open();
    expect(EN.querySelector('[lang="en"]')).not.toBeNull();
    expect(
      within(EN).getByRole('heading', { level: 3, name: 'what it should do' }),
    ).toBeInTheDocument();
    expect(
      within(EN).getByText(
        'Returns the index of the largest value in nums; if the maximum repeats, the first one. With an empty nums it returns 0.',
      ),
    ).toBeInTheDocument();
    expect(within(EN).getByText('type: comparison')).toBeInTheDocument();
    expect(within(EN).getByText('mutation: > → >=')).toBeInTheDocument();
    expect(within(EN).getByRole('heading', { level: 3, name: 'tests' })).toBeInTheDocument();
    expect(EN).toHaveTextContent('maxIndex of [3, 7, 2] returns 1, passes');
    expect(
      within(EN).getByRole('heading', { level: 3, name: 'the failing test' }).parentElement,
    ).toHaveTextContent('expected 0 · got 2');
    expect(
      within(EN).getByRole('heading', { level: 3, name: /the fix · line 4/ }),
    ).toBeInTheDocument();
    expect(within(EN).getByRole('region', { name: 'Fix for line 4 in JavaScript' })).toBeVisible();
    expect(within(EN).getByRole('heading', { level: 3, name: 'Why it fails' })).toBeInTheDocument();
    expect(
      within(EN).getByText(
        'The condition that decides whether best changes uses >= instead of >: on a tie it moves too.',
      ),
    ).toBeInTheDocument();
    const enCode = within(EN).getByRole('tabpanel', { name: 'Code of maxIndex in JavaScript' });
    expect(enCode).toHaveTextContent('bug line');
    expect(norm((enCode.textContent ?? '').replace('bug line', ''))).toBe(
      norm((codeES(ES).textContent ?? '').replace('línea del bug', '')),
    );
    for (const es of [
      'qué debería hacer',
      'Por qué falla',
      'comparación',
      'línea del bug',
      'esperado',
    ]) {
      expect(EN).not.toHaveTextContent(es);
    }
  });

  it('columnas lado a lado y jerarquía de encabezados (TS-14)', async () => {
    const { ES, EN } = await open();
    expect(ES.parentElement).toHaveClass('lg:grid-cols-2');
    expect(EN.parentElement).toBe(ES.parentElement);
    expect(ES.compareDocumentPosition(EN) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    for (const col of [ES, EN]) {
      expect(within(col).queryAllByRole('heading', { level: 1 })).toHaveLength(0);
      expect(within(col).queryAllByRole('heading', { level: 2 })).toHaveLength(0);
    }
    expect(within(ES).getByRole('heading', { level: 3, name: 'ES' })).toBeInTheDocument();
    expect(within(EN).getByRole('heading', { level: 3, name: 'EN' })).toBeInTheDocument();
  });

  it('pestañas independientes, el fix sigue a la pestaña, sin efectos (TS-15)', async () => {
    const { user, ES, EN } = await open();
    await user.click(within(ES).getByRole('tab', { name: 'Go' }));
    expect(within(ES).getByRole('tab', { name: 'Go' })).toHaveAttribute('aria-selected', 'true');
    const panel = within(ES).getByRole('tabpanel', { name: 'Código de maxIndex en Go' });
    expect(panel).toHaveTextContent('if nums[i] >= nums[best] {');
    expect(panel).toHaveTextContent('línea del bug');
    expect(ES).toHaveTextContent('max_index.go');
    expect(within(ES).getByRole('region', { name: 'Fix de la línea 4 en Go' })).toHaveTextContent(
      'if nums[i] > nums[best] {',
    );
    expect(within(EN).getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(within(EN).getByRole('region', { name: 'Fix for line 4 in JavaScript' })).toBeVisible();
    expect(requests.filter((r) => r.pathname !== '/api/admin/challenges/upcoming')).toHaveLength(0);
  });

  it('pestañas con teclado (TS-16)', async () => {
    const { user, ES, EN } = await open();
    await user.click(within(EN).getByRole('tab', { name: 'JavaScript' }));
    await user.keyboard('{ArrowRight}');
    const go = within(EN).getByRole('tab', { name: 'Go' });
    expect(go).toHaveFocus();
    expect(go).toHaveAttribute('aria-selected', 'true');
    expect(within(EN).getByRole('tabpanel', { name: 'Code of maxIndex in Go' })).toBeVisible();
    expect(within(EN).getByRole('region', { name: 'Fix for line 4 in Go' })).toBeVisible();
    await user.keyboard('{ArrowRight}');
    expect(within(EN).getByRole('tab', { name: 'Java' })).toHaveFocus();
    expect(
      within(EN).getByRole('tabpanel', { name: 'Code of maxIndex in Java' }),
    ).toHaveTextContent('if (nums[i] >= nums[best]) {');
    await user.keyboard('{ArrowLeft}');
    expect(within(EN).getByRole('tab', { name: 'Go' })).toHaveFocus();
    expect(within(ES).getByRole('tab', { name: 'JavaScript' })).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });

  it('solo lectura (TS-17)', async () => {
    const { ES, EN } = await open();
    for (const col of [ES, EN]) {
      expect(within(col).queryAllByRole('button')).toHaveLength(0);
      expect(within(col).queryAllByRole('radio')).toHaveLength(0);
      expect(within(col).queryAllByRole('radiogroup')).toHaveLength(0);
      expect(within(col).getAllByRole('tab')).toHaveLength(3);
      expect(col.querySelector('[aria-live]')).toBeNull();
      expect(within(col).getByRole('tabpanel')).toHaveAttribute('tabindex', '0');
    }
    expect(
      within(ES).getByRole('region', { name: 'Fix de la línea 4 en JavaScript' }),
    ).toHaveAttribute('tabindex', '0');
  });

  it('datos del desafío genéricos (TS-18)', async () => {
    const { dialog, ES } = await open();
    const common = within(dialog).getByRole('region', { name: 'Datos del desafío' });
    for (const [k, v] of [
      ['template', 'extreme_index'],
      ['function_name', 'maxIndex'],
      ['bug_type', 'comparison'],
      ['mutation.from', '>'],
      ['mutation.to', '>='],
      ['bug_line', '4'],
      ['pickable_lines', '2, 3, 4, 5, 8'],
    ]) {
      expect(common).toHaveTextContent(k as string);
      expect(common).toHaveTextContent(v as string);
    }
    expect(dialog.textContent).not.toContain('Culpables posibles');
    expect(ES.querySelectorAll('dt')).toHaveLength(0);
  });

  it('log de verificación genérico con los checks de Bug Hunt (TS-19)', async () => {
    const { dialog } = await open();
    const log = within(dialog).getByRole('region', { name: 'Log de verificación' });
    const items = within(log).getAllByRole('listitem');
    expect(items).toHaveLength(13);
    const names = [
      'texts_bilingual',
      'code_shape',
      'lines_consistent',
      'tests_consistent',
      'variety_combo',
      'run_correct_js',
      'run_correct_go',
      'run_correct_java',
      'run_mutant_js',
      'run_mutant_go',
      'run_mutant_java',
      'correct_agrees',
      'mutant_agrees',
    ];
    names.forEach((n, i) => expect(items[i]).toHaveTextContent(n));
    for (const re of [
      /run_correct_go\s*·\s*280 ms/,
      /run_mutant_java\s*·\s*505 ms/,
      /correct_agrees\s*·\s*8 tests/,
      /mutant_agrees\s*·\s*8 tests/,
    ]) {
      expect(log.textContent).toMatch(re);
    }
    expect(within(log).getAllByText('verificación correcta').length).toBeGreaterThan(0);
    expect(dialog.textContent).not.toMatch(/seed/i);
  });

  it('payload inválido: aviso y vista genérica sin cerrar el detalle (TS-20)', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    server.use(adminHandlers.upcoming(UPCOMING_BUG_HUNT_BAD_PAYLOAD));
    const { user } = render();
    const dialog = await openCell(user, '02/12 #32', 'Bug Hunt');
    expect(
      await within(dialog).findByText(
        'No pudimos mostrar la preview del juego. Mostramos los datos del desafío.',
      ),
    ).toBeInTheDocument();
    const es = within(dialog).getByRole('region', { name: 'ES' });
    expect(es).toHaveTextContent('Devuelve el índice del mayor valor de nums');
    expect(es).toHaveTextContent('La condición que decide si best cambia');
    expect(within(dialog).getByRole('region', { name: 'EN' })).toBeInTheDocument();
    expect(within(dialog).getByRole('region', { name: 'Datos del desafío' })).toHaveTextContent(
      'typo',
    );
    expect(
      within(dialog).getByRole('heading', { name: 'Log de verificación' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Regenerar' })).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBe(dialog);
    expect(
      spy.mock.calls.filter(([only, ...rest]) => only instanceof Error && rest.length === 0),
    ).toHaveLength(1);
    spy.mockRestore();
  });

  it('axe sin violaciones con los previews de Bug Hunt y Big O (TS-21)', async () => {
    server.use(adminHandlers.upcoming(UPCOMING_BUG_HUNT));
    const first = render();
    const dialog = await openCell(first.user, '02/12 #32', 'Bug Hunt');
    await previewReady(dialog);
    await within(dialog).findByText('Why it fails');
    expect(await axe(first.container)).toHaveNoViolations();
    first.unmount();
    server.use(adminHandlers.upcoming(UPCOMING_BIG_O));
    const second = render();
    const bigO = await openCell(second.user, '02/12 #32', 'Big O');
    await previewReady(bigO);
    await within(bigO).findByText('The outer loop runs n times.');
    expect(await axe(second.container)).toHaveNoViolations();
  });

  it('el admin queda en español y solo el panel EN declara inglés (TS-22)', async () => {
    const before = document.documentElement.lang;
    const { dialog, ES, EN } = await open();
    expect(document.documentElement.lang).toBe(before);
    const en = dialog.querySelectorAll('[lang="en"]');
    const es = dialog.querySelectorAll('[lang="es"]');
    expect(en).toHaveLength(1);
    expect(EN.contains(en[0] as Element)).toBe(true);
    expect(es).toHaveLength(1);
    expect(ES.contains(es[0] as Element)).toBe(true);
  });

  it('Escape cierra el drawer y devuelve el foco a la celda (TS-24)', async () => {
    const { user } = await open();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.getByRole('button', { name: /Bug Hunt #32, 2026-12-02/ })).toHaveFocus();
  });
});
