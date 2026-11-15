import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { METRICS_EMPTY, METRICS_OK, STREAKS_ZERO, metrics } from '@/test/fixtures/metrics';
import { OPEN_GROUPS, SESSION } from '@/test/fixtures/reports';
import { useMetricsClock } from '@/test/helpers';
import { adminHandlers, requestsTo, server } from '@/test/msw';
import { renderWithProviders } from '@/test/render';

const URL_OK = '/metrics?from=2026-12-01&to=2026-12-03';
const NBSP = ' ';

async function renderMetrics(body: unknown = METRICS_OK, route = URL_OK) {
  server.use(adminHandlers.metrics(body), adminHandlers.reports('open', OPEN_GROUPS));
  const view = renderWithProviders({ route, session: SESSION });
  await screen.findByRole('heading', { level: 2, name: 'Calidad por desafío' });
  return view;
}

const table = (name: string) => screen.getByRole('table', { name });
const rows = (t: HTMLElement) =>
  [...t.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('th, td')].map((c) => c.textContent),
  );
const headers = (t: HTMLElement) =>
  within(t)
    .getAllByRole('columnheader')
    .map((h) => h.textContent);
const firstCol = (t: HTMLElement) => rows(t).map((r) => r[0]);

beforeEach(() => {
  useMetricsClock();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Métricas (P-05): cifras y tablas', () => {
  it('cifras resumen (TS-26)', async () => {
    await renderMetrics();
    const labels = ['Jugadores únicos', 'Retención D1', 'Retención D7', 'Partidas completadas'];
    const pairs = labels.map((l) => [screen.getByText(l).previousElementSibling?.textContent, l]);
    expect(pairs).toEqual([
      ['1.284', 'Jugadores únicos'],
      [`41,3${NBSP}%`, 'Retención D1'],
      [`18,2${NBSP}%`, 'Retención D7'],
      ['9.730', 'Partidas completadas'],
    ]);
  });

  it('tabla de jugadores diarios (TS-27)', async () => {
    await renderMetrics();
    const t = table('Jugadores diarios');
    expect(headers(t)).toEqual([
      'Fecha',
      'Total',
      'Devdle',
      'Grep Grid',
      'Tech Timeline',
      'Big O',
      'Bug Hunt',
    ]);
    expect(rows(t)).toEqual([
      ['03/12/2026', '12', '0', '7', '5', '3', '0'],
      ['02/12/2026', '0', '0', '0', '0', '0', '0'],
      ['01/12/2026', '150', '120', '0', '0', '0', '80'],
    ]);
    expect(
      within(t)
        .getAllByRole('rowheader')
        .map((h) => h.textContent),
    ).toEqual(['03/12/2026', '02/12/2026', '01/12/2026']);
    expect(t).toHaveAccessibleDescription(
      'El total cuenta a cada jugador una vez por día: no es la suma de las columnas.',
    );
  });

  it('tabla de retención (TS-28)', async () => {
    await renderMetrics();
    const t = table('Retención por cohorte');
    expect(headers(t)).toEqual(['Cohorte (primer día)', 'Jugadores', 'D1', 'D7']);
    expect(rows(t)).toEqual([
      ['03/12/2026', '20', `35,0${NBSP}%`, '—'],
      ['01/12/2026', '100', `40,0${NBSP}%`, `25,0${NBSP}%`],
    ]);
    expect(t).toHaveAccessibleDescription(
      'Cohorte: jugadores cuya primera partida completada fue ese día. D1 y D7: porcentaje que completó alguna partida exactamente 1 y 7 días después. Las partidas anuladas cuentan como completadas.',
    );
  });

  it('tabla de rachas con su nota (TS-29)', async () => {
    await renderMetrics();
    const t = table('Distribución de rachas');
    expect(headers(t)).toEqual(['Tramo de racha', 'Jugadores', '% del total']);
    const share = `20,0${NBSP}%`;
    expect(rows(t)).toEqual([
      ['0', '1', share],
      ['1', '1', share],
      ['2–6', '1', share],
      ['7–29', '1', share],
      ['30+', '1', share],
    ]);
    expect(t).toHaveAccessibleDescription(
      'Racha global viva a hoy: no depende del rango elegido. El tramo 0 incluye a quienes nunca completaron una partida.',
    );
  });

  it('tabla de calidad con el orden por defecto (TS-30)', async () => {
    await renderMetrics();
    const t = table('Calidad por desafío');
    const cols = within(t).getAllByRole('columnheader');
    expect(cols.map((c) => within(c).getByRole('button').textContent)).toEqual([
      'Desafío',
      'Juego',
      'Iniciadas',
      'Terminadas',
      'Completado',
      'Victorias',
      'Reportes',
      'Estado',
    ]);
    expect(cols[0]).toHaveAttribute('aria-sort', 'descending');
    for (const c of cols.slice(1)) expect(c).not.toHaveAttribute('aria-sort');
    expect(rows(t)).toEqual([
      ['#8 · 03/12', 'Big O', '300', '290', `96,7${NBSP}%`, `7,9${NBSP}%`, '2', 'publicado'],
      ['#7 · 02/12', 'Devdle', '120', '0', `0,0${NBSP}%`, '—', '5', 'anulado'],
      ['#6 · 01/12', 'Tech Timeline', '0', '0', '—', '—', '0', 'publicado'],
    ]);
    expect(t).toHaveAccessibleDescription(
      'Las partidas anuladas no cuentan en terminadas ni en victorias.',
    );
  });

  it('ordena por «Reportes» y revierte sin pedir datos (TS-31)', async () => {
    const { user } = await renderMetrics();
    const t = table('Calidad por desafío');
    const button = within(t).getByRole('button', { name: 'Reportes' });
    await user.click(button);
    expect(firstCol(t)).toEqual(['#6 · 01/12', '#8 · 03/12', '#7 · 02/12']);
    expect(button.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(within(t).getByRole('button', { name: 'Desafío' }).closest('th')).not.toHaveAttribute(
      'aria-sort',
    );
    await user.click(button);
    expect(firstCol(t)).toEqual(['#7 · 02/12', '#8 · 03/12', '#6 · 01/12']);
    expect(button.closest('th')).toHaveAttribute('aria-sort', 'descending');
    expect(requestsTo('GET', '/api/admin/metrics')).toHaveLength(1);
  });

  it('«—» queda siempre al final al ordenar por «Completado» (TS-32)', async () => {
    const { user } = await renderMetrics();
    const t = table('Calidad por desafío');
    const button = within(t).getByRole('button', { name: 'Completado' });
    await user.click(button);
    expect(firstCol(t)).toEqual(['#7 · 02/12', '#8 · 03/12', '#6 · 01/12']);
    await user.click(button);
    expect(firstCol(t)).toEqual(['#8 · 03/12', '#7 · 02/12', '#6 · 01/12']);
  });

  it('se ordena con teclado (TS-33)', async () => {
    const { user } = await renderMetrics();
    const t = table('Calidad por desafío');
    const button = within(t).getByRole('button', { name: 'Victorias' });
    button.focus();
    await user.keyboard('{Enter}');
    expect(button.closest('th')).toHaveAttribute('aria-sort', 'ascending');
    expect(firstCol(t)).toEqual(['#8 · 03/12', '#7 · 02/12', '#6 · 01/12']);
    await user.keyboard(' ');
    expect(button.closest('th')).toHaveAttribute('aria-sort', 'descending');
    expect(button).toHaveFocus();
  });

  it('rango sin actividad (TS-34)', async () => {
    await renderMetrics(METRICS_EMPTY, '/metrics?from=2026-11-01&to=2026-11-30');
    const pairs = ['Jugadores únicos', 'Retención D1', 'Retención D7', 'Partidas completadas'].map(
      (l) => [screen.getByText(l).previousElementSibling?.textContent, l],
    );
    expect(pairs).toEqual([
      ['0', 'Jugadores únicos'],
      ['—', 'Retención D1'],
      ['—', 'Retención D7'],
      ['0', 'Partidas completadas'],
    ]);
    for (const [name, span] of [
      ['Jugadores diarios', 7],
      ['Retención por cohorte', 4],
      ['Calidad por desafío', 8],
    ] as const) {
      const t = table(name);
      expect(rows(t)).toEqual([['Sin datos en el rango.']]);
      expect(t.querySelector('tbody td')).toHaveAttribute('colspan', String(span));
      expect(t.querySelectorAll('thead th').length).toBe(span);
    }
    expect(rows(table('Distribución de rachas'))).toEqual([
      ['0', '412', `86,4${NBSP}%`],
      ['1', '35', `7,3${NBSP}%`],
      ['2–6', '20', `4,2${NBSP}%`],
      ['7–29', '8', `1,7${NBSP}%`],
      ['30+', '2', `0,4${NBSP}%`],
    ]);
    expect(screen.queryByRole('alert')).toBeNull();
    for (const t of screen.getAllByRole('table')) {
      expect(t.getAttribute('aria-describedby')).toBeTruthy();
      expect(t).toHaveAccessibleDescription(/\S/);
    }
  });

  it('rachas en cero muestran «—» (TS-35)', async () => {
    await renderMetrics(metrics({ streak_distribution: STREAKS_ZERO }));
    const t = table('Distribución de rachas');
    expect(rows(t)).toEqual(['0', '1', '2–6', '7–29', '30+'].map((label) => [label, '0', '—']));
  });

  it('no tiene violaciones de axe con datos y vacío (TS-36)', async () => {
    const full = await renderMetrics();
    expect(await axe(full.container)).toHaveNoViolations();
    full.unmount();
    const empty = await renderMetrics(METRICS_EMPTY, '/metrics?from=2026-11-01&to=2026-11-30');
    expect(await axe(empty.container)).toHaveNoViolations();
  });

  it('las regiones de tabla se alcanzan con teclado (TS-37)', async () => {
    await renderMetrics();
    const regions = screen.getAllByRole('region').filter((r) => r.hasAttribute('tabindex'));
    expect(regions.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Tabla de jugadores diarios',
      'Tabla de retención por cohorte',
      'Tabla de distribución de rachas',
      'Tabla de calidad por desafío',
    ]);
    for (const r of regions) {
      expect(r).toHaveAttribute('tabindex', '0');
      expect(within(r).getByRole('table')).toBeInTheDocument();
    }
  });

  it('no expone identificadores individuales ni enlaces (TS-38)', async () => {
    const { container } = await renderMetrics();
    expect(container.textContent).not.toContain('c0000000-0000-4000-8000-000000000008');
    expect(container.textContent).not.toContain('player_id');
    expect(within(table('Calidad por desafío')).queryAllByRole('link')).toHaveLength(0);
  });

  it('estructura del layout desktop (TS-39)', async () => {
    const { container } = await renderMetrics();
    const form = container.querySelector('form') as HTMLElement;
    const figures = screen.getByText('Jugadores únicos').closest('.grid') as HTMLElement;
    const h2 = (name: string) =>
      screen.getByRole('heading', { level: 2, name }).closest('section') as HTMLElement;
    const daily = h2('Jugadores diarios');
    const retention = h2('Retención por cohorte');
    const streaks = h2('Distribución de rachas');
    const quality = h2('Calidad por desafío');
    const before = (a: Node, b: Node) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    expect(before(form, figures)).toBe(true);
    expect(before(figures, daily)).toBe(true);
    expect(before(daily, retention)).toBe(true);
    expect(before(retention, streaks)).toBe(true);
    expect(before(streaks, quality)).toBe(true);
    expect(retention.parentElement).toBe(streaks.parentElement);
    expect(retention).toHaveClass('lg:col-span-7');
    expect(streaks).toHaveClass('lg:col-span-5');
    expect(figures).toHaveClass('lg:grid-cols-4');
  });
});
