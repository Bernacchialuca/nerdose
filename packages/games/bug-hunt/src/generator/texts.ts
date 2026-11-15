import type { OperatorId } from './mutation/operators';
import type { Localized } from './types';

type Tokens = { Role: string; from: string; to: string };

/** Step 1 per operator: what the changed line does. `Role` already starts with a capital letter. */
export const STEP_ONE: Record<OperatorId, (t: Tokens) => Localized> = {
  loop_cond_relax: ({ Role, from, to }) => ({
    es: `${Role} usa ${to} en lugar de ${from}: el recorrido da una vuelta de más.`,
    en: `${Role} uses ${to} instead of ${from}: the loop runs one extra time.`,
  }),
  loop_cond_tighten: ({ Role, from, to }) => ({
    es: `${Role} usa ${to} en lugar de ${from}: el recorrido se queda una vuelta corto.`,
    en: `${Role} uses ${to} instead of ${from}: the loop stops one iteration short.`,
  }),
  loop_start_shift: ({ Role, from, to }) => ({
    es: `${Role} es ${to} en lugar de ${from}: el recorrido empieza en la posición equivocada.`,
    en: `${Role} is ${to} instead of ${from}: the loop starts at the wrong position.`,
  }),
  bound_minus_one: ({ Role }) => ({
    es: `${Role} tiene un - 1 de más: se queda una posición corto.`,
    en: `${Role} has an extra - 1: it stops one position short.`,
  }),
  bound_plus_one: ({ Role }) => ({
    es: `${Role} tiene un + 1 de más: se pasa una posición.`,
    en: `${Role} has an extra + 1: it goes one position too far.`,
  }),
  relax_comparison: ({ Role, from, to }) => ({
    es: `${Role} usa ${to} en lugar de ${from}: con valores iguales también se cumple.`,
    en: `${Role} uses ${to} instead of ${from}: it also holds when the values are equal.`,
  }),
  tighten_comparison: ({ Role, from, to }) => ({
    es: `${Role} usa ${to} en lugar de ${from}: con valores iguales ya no se cumple.`,
    en: `${Role} uses ${to} instead of ${from}: it no longer holds when the values are equal.`,
  }),
  swap_arith: ({ Role, from, to }) => ({
    es: `${Role} usa ${to} en lugar de ${from}: la cuenta va para el lado contrario.`,
    en: `${Role} uses ${to} instead of ${from}: the arithmetic goes the wrong way.`,
  }),
  swap_compound: ({ Role, from, to }) => ({
    es: `${Role} usa ${to} en lugar de ${from}: acumula para el lado contrario.`,
    en: `${Role} uses ${to} instead of ${from}: it accumulates the wrong way.`,
  }),
  swap_logical: ({ Role, from, to }) => ({
    es: `${Role} usa ${to} en lugar de ${from}: junta las dos condiciones al revés.`,
    en: `${Role} uses ${to} instead of ${from}: it combines the two conditions the wrong way.`,
  }),
  swap_variable: ({ Role, from, to }) => ({
    es: `${Role} usa ${to} en lugar de ${from}: mira un valor que no corresponde.`,
    en: `${Role} uses ${to} instead of ${from}: it looks at the wrong value.`,
  }),
  shift_init: ({ Role, from, to }) => ({
    es: `${Role} es ${to} en lugar de ${from}: la función arranca desde un valor equivocado.`,
    en: `${Role} is ${to} instead of ${from}: the function starts from the wrong value.`,
  }),
  flip_bool_init: ({ Role, from, to }) => ({
    es: `${Role} es ${to} en lugar de ${from}: la función arranca con la respuesta equivocada.`,
    en: `${Role} is ${to} instead of ${from}: the function starts out with the wrong answer.`,
  }),
  early_return: ({ Role, to }) => ({
    es: `${Role} se cambió por ${to}: la función sale ahí, antes de terminar de recorrer.`,
    en: `${Role} was replaced by ${to}: the function returns there, before finishing the loop.`,
  }),
  negate_condition: ({ Role }) => ({
    es: `${Role} está invertida: se cumple justo cuando no debería.`,
    en: `${Role} is inverted: it holds exactly when it should not.`,
  }),
};

/** Step 2: the trace on the hidden test, built from its values. */
export const stepTwo = (v: { call: string; expected: string; actual: string }): Localized => ({
  es: `Con ${v.call} devuelve ${v.actual} en lugar de ${v.expected}.`,
  en: `With ${v.call} it returns ${v.actual} instead of ${v.expected}.`,
});

/** Step 3: why the visible tests pass, and the fix. */
export const stepThree = (fix: Localized): Localized => ({
  es: `Los tests visibles no pasan por ese caso, por eso dan bien. El fix: ${fix.es}.`,
  en: `The visible tests never hit that case, so they pass. The fix: ${fix.en}.`,
});

export function fixText(operator: OperatorId, from: string): Localized {
  switch (operator) {
    case 'bound_minus_one':
      return { es: 'sacar el - 1', en: 'remove the - 1' };
    case 'bound_plus_one':
      return { es: 'sacar el + 1', en: 'remove the + 1' };
    case 'negate_condition':
      return from === '=='
        ? { es: 'volver a comparar por igualdad', en: 'compare for equality again' }
        : from === '!='
          ? { es: 'volver a comparar por distinto', en: 'compare for inequality again' }
          : { es: `volver a ${from}`, en: `go back to ${from}` };
    default:
      return { es: `volver a ${from}`, en: `go back to ${from}` };
  }
}
