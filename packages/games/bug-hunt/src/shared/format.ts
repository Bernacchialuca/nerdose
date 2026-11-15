export type TestArg = number | readonly number[];
export type TestValue = number | boolean | readonly number[];

export function formatValue(v: TestValue): string {
  if (typeof v === 'object') return `[${v.join(', ')}]`;
  return String(v);
}

/** Arguments of a call, e.g. `[3, 7, 2], 4`. */
export function formatArgs(input: readonly TestArg[]): string {
  return input.map(formatValue).join(', ');
}

/** Same call text for the player (client) and for the server-side explanation (generator). */
export function formatCall(name: string, input: readonly TestArg[]): string {
  return `${name}(${formatArgs(input)})`;
}
