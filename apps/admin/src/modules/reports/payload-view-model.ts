import type { VerificationLog } from '@nerdose/core';

export type BilingualRow = { path: string; es: string; en: string };
export type CommonRow = { path: string; value: string };

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const isPrimitive = (v: unknown): boolean => v === null || typeof v !== 'object';

function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value.every(isPrimitive)) return value.map(formatValue).join(', ');
  if (isPrimitive(value)) return String(value);
  return JSON.stringify(value);
}

const isBilingual = (v: Record<string, unknown>): boolean => {
  const keys = Object.keys(v);
  return keys.length === 2 && keys.includes('es') && keys.includes('en');
};

export function flattenPayload(payload: Record<string, unknown>): {
  bilingual: BilingualRow[];
  common: CommonRow[];
} {
  const bilingual: BilingualRow[] = [];
  const common: CommonRow[] = [];

  const visit = (value: unknown, path: string): void => {
    if (isRecord(value)) {
      if (path !== '' && isBilingual(value)) {
        bilingual.push({ path, es: formatValue(value.es), en: formatValue(value.en) });
        return;
      }
      for (const [key, child] of Object.entries(value)) {
        visit(child, path === '' ? key : `${path}.${key}`);
      }
      return;
    }
    if (Array.isArray(value) && !value.every(isPrimitive)) {
      value.forEach((child, index) => {
        visit(child, `${path}.${index}`);
      });
      return;
    }
    common.push({ path, value: formatValue(value) });
  };

  visit(payload, '');
  return { bilingual, common };
}

export type VerificationView =
  | { kind: 'log'; log: VerificationLog }
  | { kind: 'raw'; rows: CommonRow[] };

export function readVerification(verification: Record<string, unknown>): VerificationView {
  if (Array.isArray(verification.checks)) {
    return { kind: 'log', log: verification as unknown as VerificationLog };
  }
  return {
    kind: 'raw',
    rows: Object.entries(verification).map(([path, value]) => ({
      path,
      value: formatValue(value),
    })),
  };
}
