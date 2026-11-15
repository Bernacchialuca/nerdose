export const MIN_INT = -(2 ** 31);
export const MAX_INT = 2 ** 31 - 1;

export function isInt32(value: unknown): value is number {
  return (
    typeof value === 'number' && Number.isInteger(value) && value >= MIN_INT && value <= MAX_INT
  );
}

/** Argument as shown in `invalid_argument` errors: numbers as `String`, arrays as JSON. */
export function describeArg(arg: unknown): string {
  return typeof arg === 'number' ? String(arg) : JSON.stringify(arg);
}
