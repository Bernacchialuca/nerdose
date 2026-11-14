const INSTANT = new Intl.DateTimeFormat('es', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

const RELATIVE = new Intl.RelativeTimeFormat('es', { numeric: 'auto', style: 'narrow' });

export function formatInstant(iso: string): string {
  const part = Object.fromEntries(
    INSTANT.formatToParts(new Date(iso)).map((p) => [p.type, p.value]),
  );
  return `${part.year}-${part.month}-${part.day} ${part.hour}:${part.minute}`;
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return RELATIVE.format(-minutes, 'minute');
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return RELATIVE.format(-hours, 'hour');
  return RELATIVE.format(-Math.floor(hours / 24), 'day');
}

const TIME = new Intl.DateTimeFormat('es', {
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatTime(iso: string): string {
  return TIME.format(new Date(iso));
}
