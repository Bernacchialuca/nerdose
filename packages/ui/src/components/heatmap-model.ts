export const HEATMAP_DAYS = 365;
export const HEATMAP_WEEKS = 53;
export const HEATMAP_MAX = 5;

export type HeatmapLevel = 0 | 1 | 2 | 3 | 4;
export type HeatmapDay = { date: string; completed: number };
export type HeatmapCell = {
  date: string;
  completed: number;
  level: HeatmapLevel;
  isToday: boolean;
};
export type HeatmapWeek = { cells: readonly (HeatmapCell | null)[] };
export type HeatmapDayInfo = {
  date: string;
  longDate: string;
  shortDate: string;
  completed: number;
  isToday: boolean;
};
export type HeatmapModel = {
  start: string;
  weeks: readonly HeatmapWeek[];
  total: number;
  byDate: ReadonlyMap<string, HeatmapCell>;
};

function parse(date: string): number {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return Date.UTC(y, m - 1, d);
}

function format(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

/** Adds `n` days to a 'YYYY-MM-DD' date, in UTC (no DST jumps). */
export function addDays(date: string, n: number): string {
  return format(parse(date) + n * 86_400_000);
}

/** Row of a day in the grid: Monday = 0 ... Sunday = 6. */
function rowOf(date: string): number {
  return (new Date(parse(date)).getUTCDay() + 6) % 7;
}

export function heatmapLevel(completed: number): HeatmapLevel {
  if (completed <= 0) return 0;
  if (completed >= 4) return 4;
  return Math.floor(completed) as HeatmapLevel;
}

export function buildHeatmap(today: string, days: readonly HeatmapDay[]): HeatmapModel {
  const start = addDays(today, -(HEATMAP_DAYS - 1));
  const counts = new Map<string, number>();
  for (const day of days) {
    if (day.date < start || day.date > today) continue;
    counts.set(day.date, Math.min(HEATMAP_MAX, Math.max(0, Math.floor(day.completed))));
  }
  const col0 = addDays(start, -rowOf(start));
  const byDate = new Map<string, HeatmapCell>();
  let total = 0;
  const weeks: HeatmapWeek[] = [];
  for (let w = 0; w < HEATMAP_WEEKS; w += 1) {
    const cells: (HeatmapCell | null)[] = [];
    for (let r = 0; r < 7; r += 1) {
      const date = addDays(col0, w * 7 + r);
      if (date < start || date > today) {
        cells.push(null);
        continue;
      }
      const completed = counts.get(date) ?? 0;
      const cell: HeatmapCell = {
        date,
        completed,
        level: heatmapLevel(completed),
        isToday: date === today,
      };
      total += completed;
      byDate.set(date, cell);
      cells.push(cell);
    }
    weeks.push({ cells });
  }
  return { start, weeks, total, byDate };
}

const monthFormatters = new Map<string, Intl.DateTimeFormat>();
const longFormatters = new Map<string, Intl.DateTimeFormat>();
const weekdayFormatters = new Map<string, Intl.DateTimeFormat>();
const numericFormatters = new Map<string, Intl.DateTimeFormat>();

function cached(
  cache: Map<string, Intl.DateTimeFormat>,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  let f = cache.get(locale);
  if (!f) {
    f = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' });
    cache.set(locale, f);
  }
  return f;
}

export function monthLabels(
  weeks: readonly HeatmapWeek[],
  locale: string,
): { week: number; label: string }[] {
  const formatter = cached(monthFormatters, locale, { month: 'short' });
  const labels: { week: number; label: string }[] = [];
  weeks.forEach((week, w) => {
    for (const cell of week.cells) {
      if (cell && cell.date.endsWith('-01')) {
        labels.push({ week: w, label: formatter.format(parse(cell.date)) });
      }
    }
  });
  return labels;
}

/** Next date for a navigation key, the same date if it leaves the range, or null if unhandled. */
export function moveHeatmapDate(
  current: string,
  key: string,
  start: string,
  today: string,
): string | null {
  let target: string;
  switch (key) {
    case 'ArrowUp':
      target = addDays(current, -1);
      break;
    case 'ArrowDown':
      target = addDays(current, 1);
      break;
    case 'ArrowLeft':
      target = addDays(current, -7);
      break;
    case 'ArrowRight':
      target = addDays(current, 7);
      break;
    case 'Home':
      target = start;
      break;
    case 'End':
      target = today;
      break;
    default:
      return null;
  }
  return target < start || target > today ? current : target;
}

export function formatHeatmapDay(
  date: string,
  locale: string,
): { longDate: string; shortDate: string } {
  const ms = parse(date);
  const longDate = cached(longFormatters, locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(ms);
  const weekday = cached(weekdayFormatters, locale, { weekday: 'short' }).format(ms);
  const parts = cached(numericFormatters, locale, {
    day: '2-digit',
    month: '2-digit',
  }).formatToParts(ms);
  const numeric = parts
    .map((p) => (p.type === 'day' || p.type === 'month' ? p.value.padStart(2, '0') : p.value))
    .join('');
  return { longDate, shortDate: `${weekday} ${numeric}` };
}
