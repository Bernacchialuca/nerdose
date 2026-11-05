const MS_PER_DAY = 86_400_000;

/** UTC calendar day of `now` as `YYYY-MM-DD`. */
export function today(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** `day - launchDate + 1`, or `null` before launch. Inputs must be valid `YYYY-MM-DD`. */
export function challengeNumber(day: string, launchDate: string): number | null {
  const diff =
    (Date.parse(`${day}T00:00:00.000Z`) - Date.parse(`${launchDate}T00:00:00.000Z`)) / MS_PER_DAY;
  return diff < 0 ? null : diff + 1;
}

/** Next 00:00 UTC strictly after `now`. */
export function nextResetAt(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

export function secondsToReset(now: Date): number {
  // ceil so the counter only reaches 0 at the boundary; the client refetches at 0 and must get the new day.
  return Math.ceil((nextResetAt(now).getTime() - now.getTime()) / 1000);
}
