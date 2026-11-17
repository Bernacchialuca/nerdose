import { describe, expect, it } from 'vitest';

import {
  addDays,
  buildHeatmap,
  formatHeatmapDay,
  heatmapLevel,
  monthLabels,
  moveHeatmapDate,
} from './heatmap-model';

const F_DAYS = [
  { date: '2025-11-16', completed: 1 },
  { date: '2026-11-10', completed: 5 },
  { date: '2026-11-15', completed: 2 },
];

describe('heatmap-model', () => {
  it('maps counts to levels, 4 and 5 share a tone (TS-1)', () => {
    expect([0, 1, 2, 3, 4, 5, -1, 9].map(heatmapLevel)).toEqual([0, 1, 2, 3, 4, 4, 0, 4]);
  });

  it('adds days in UTC (TS-2)', () => {
    expect(addDays('2026-11-15', -364)).toBe('2025-11-16');
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
  });

  it('builds the grid with today on a Sunday (TS-3)', () => {
    const m = buildHeatmap('2026-11-15', []);
    expect(m.start).toBe('2025-11-16');
    expect(m.weeks).toHaveLength(53);
    for (const w of m.weeks) expect(w.cells).toHaveLength(7);
    expect(m.weeks.flatMap((w) => w.cells).filter(Boolean)).toHaveLength(365);
    expect(m.weeks[0]?.cells.slice(0, 6)).toEqual([null, null, null, null, null, null]);
    expect(m.weeks[0]?.cells[6]?.date).toBe('2025-11-16');
    expect(m.weeks[52]?.cells[0]?.date).toBe('2026-11-09');
    expect(m.weeks[52]?.cells[6]).toEqual({
      date: '2026-11-15',
      completed: 0,
      level: 0,
      isToday: true,
    });
    expect(m.total).toBe(0);
  });

  it('builds the grid with today on a Monday (TS-4)', () => {
    const m = buildHeatmap('2026-11-16', []);
    expect(m.start).toBe('2025-11-17');
    expect(m.weeks[0]?.cells[0]?.date).toBe('2025-11-17');
    expect(m.weeks[0]?.cells.every((c) => c !== null)).toBe(true);
    expect(m.weeks[52]?.cells[0]).toMatchObject({ date: '2026-11-16', isToday: true });
    expect(m.weeks[52]?.cells.slice(1)).toEqual([null, null, null, null, null, null]);
    expect(m.weeks).toHaveLength(53);
    expect(m.byDate.size).toBe(365);
  });

  it('fills empty days and assigns levels (TS-5)', () => {
    const m = buildHeatmap('2026-11-15', F_DAYS);
    expect(m.byDate.get('2025-11-16')).toMatchObject({ completed: 1, level: 1 });
    expect(m.byDate.get('2026-11-10')).toMatchObject({ completed: 5, level: 4 });
    expect(m.byDate.get('2026-11-15')).toMatchObject({ completed: 2, level: 2 });
    const others = [...m.byDate.values()].filter((c) => c.completed === 0);
    expect(others).toHaveLength(362);
    expect(others.every((c) => c.level === 0)).toBe(true);
    expect(m.total).toBe(8);
  });

  it('ignores out-of-range days and clamps completed (TS-6)', () => {
    const m = buildHeatmap('2026-11-15', [
      { date: '2025-11-15', completed: 3 },
      { date: '2026-11-16', completed: 1 },
      { date: '2026-11-14', completed: 9 },
    ]);
    expect(m.byDate.has('2025-11-15')).toBe(false);
    expect(m.byDate.has('2026-11-16')).toBe(false);
    expect(m.byDate.get('2026-11-14')).toMatchObject({ completed: 5, level: 4 });
    expect(m.total).toBe(5);
  });

  it('labels the column holding the 1st of each month (TS-7)', () => {
    const m = buildHeatmap('2026-11-15', []);
    const es = monthLabels(m.weeks, 'es');
    expect(es).toEqual([
      { week: 3, label: 'dic' },
      { week: 7, label: 'ene' },
      { week: 11, label: 'feb' },
      { week: 15, label: 'mar' },
      { week: 20, label: 'abr' },
      { week: 24, label: 'may' },
      { week: 29, label: 'jun' },
      { week: 33, label: 'jul' },
      { week: 37, label: 'ago' },
      { week: 42, label: 'sept' },
      { week: 46, label: 'oct' },
      { week: 50, label: 'nov' },
    ]);
    const en = monthLabels(m.weeks, 'en');
    expect(en[0]).toEqual({ week: 3, label: 'Dec' });
    expect(en[11]).toEqual({ week: 50, label: 'Nov' });
    expect(en.map((l) => l.week)).toEqual(es.map((l) => l.week));
  });

  it('moves the date within the range (TS-8)', () => {
    const s = '2025-11-16';
    const t = '2026-11-15';
    const cases: [string, string, string | null][] = [
      ['2026-11-15', 'ArrowLeft', '2026-11-08'],
      ['2026-11-08', 'ArrowUp', '2026-11-07'],
      ['2026-11-08', 'ArrowDown', '2026-11-09'],
      ['2026-11-01', 'ArrowRight', '2026-11-08'],
      ['2026-03-10', 'Home', '2025-11-16'],
      ['2026-03-10', 'End', '2026-11-15'],
      ['2026-11-15', 'ArrowRight', '2026-11-15'],
      ['2026-11-12', 'ArrowRight', '2026-11-12'],
      ['2025-11-16', 'ArrowUp', '2025-11-16'],
      ['2025-11-20', 'ArrowLeft', '2025-11-20'],
      ['2026-11-15', 'Enter', null],
    ];
    for (const [cur, key, expected] of cases) {
      expect(moveHeatmapDate(cur, key, s, t), `${cur} ${key}`).toBe(expected);
    }
  });

  it('formats dates in UTC for es and en (TS-9)', () => {
    expect(formatHeatmapDay('2026-11-08', 'es')).toEqual({
      longDate: 'domingo, 8 de noviembre de 2026',
      shortDate: 'dom 08/11',
    });
    expect(formatHeatmapDay('2026-11-08', 'en')).toEqual({
      longDate: 'Sunday, November 8, 2026',
      shortDate: 'Sun 11/08',
    });
    expect(formatHeatmapDay('2026-10-30', 'es').shortDate).toBe('vie 30/10');
  });
});
