import type { AlertThresholds } from './quality.types';

/** Solo estos motivos cuentan para el umbral de alerta (ADR-017). */
export const REPORT_THRESHOLD_REASONS = ['wrong_answer', 'ambiguous'] as const;

/** `n` reportes de umbral sobre `f` Play terminadas: ¿alerta el desafío? */
export const shouldAlert = (
  { n, f }: { n: number; f: number },
  { count, ratio, ratioMinCount }: AlertThresholds,
): boolean => n >= count || (n >= ratioMinCount && f > 0 && n / f > ratio);
