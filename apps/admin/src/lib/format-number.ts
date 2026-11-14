// `es` no agrupa números de 4 dígitos; `es-AR` sí (1.050).
const COUNT = new Intl.NumberFormat('es-AR');

export function formatCount(n: number): string {
  return COUNT.format(n);
}
