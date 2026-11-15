import type { TestInput } from './types';

export function formatValue(v: number | boolean | readonly number[]): string {
  if (typeof v === 'object') return `[${v.join(', ')}]`;
  return String(v);
}

export function formatCall(name: string, input: TestInput): string {
  return `${name}(${input.map(formatValue).join(', ')})`;
}
