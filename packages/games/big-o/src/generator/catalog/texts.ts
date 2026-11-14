import type { RecipeCategory } from '@nerdose/core';

import type { TrapKind } from './types';

export type Localized = { es: string; en: string };

const t = (es: string, en: string): Localized => ({ es, en });

export const LOOP_STEP = {
  linear: (line: number) =>
    t(`El loop de la línea ${line} corre n veces.`, `The loop on line ${line} runs n times.`),
  linearStep2: (line: number) =>
    t(
      `El loop de la línea ${line} avanza de a 2: n/2 vueltas, que sigue siendo O(n).`,
      `The loop on line ${line} steps by 2: n/2 iterations, which is still O(n).`,
    ),
  constant: (line: number, k: number) =>
    t(
      `El loop de la línea ${line} corre ${k} veces, sin importar n.`,
      `The loop on line ${line} runs ${k} times, whatever n is.`,
    ),
  dependent: (line: number) =>
    t(
      `El loop de la línea ${line} corre tantas veces como vale la variable de afuera: 0 + 1 + … + (n − 1) ≈ n²/2.`,
      `The loop on line ${line} runs as many times as the outer variable: 0 + 1 + … + (n − 1) ≈ n²/2.`,
    ),
  doubling: (line: number) =>
    t(
      `El loop de la línea ${line} duplica su variable: log₂ n vueltas.`,
      `The loop on line ${line} doubles its variable: log₂ n iterations.`,
    ),
  doublingOuter: (line: number) =>
    t(
      `El loop de la línea ${line} duplica su variable hasta el valor de la variable de afuera: log₂ i vueltas.`,
      `The loop on line ${line} doubles its variable up to the value of the outer variable: log₂ i iterations.`,
    ),
  halving: (line: number) =>
    t(
      `El loop de la línea ${line} parte su variable a la mitad: log₂ n vueltas.`,
      `The loop on line ${line} halves its variable: log₂ n iterations.`,
    ),
  halvingOuter: (line: number) =>
    t(
      `El loop de la línea ${line} parte a la mitad la variable de afuera: log₂ i vueltas.`,
      `The loop on line ${line} halves the outer variable: log₂ i iterations.`,
    ),
  binarySearch: (line: number) =>
    t(
      `El loop de la línea ${line} descarta la mitad del rango en cada vuelta: log₂ n vueltas.`,
      `The loop on line ${line} discards half of the range on each iteration: log₂ n iterations.`,
    ),
};

export const COMPOSITION = {
  nest: (a: string, b: string) =>
    t(
      `Están anidados: se multiplican, ${a} × ${b}.`,
      `They are nested, so they multiply: ${a} × ${b}.`,
    ),
  seq: (terms: readonly string[]) =>
    t(
      `Van uno después del otro: se suman, ${terms.join(' + ')}, y domina el mayor.`,
      `They run one after the other, so they add up: ${terms.join(' + ')}, and the largest dominates.`,
    ),
};

export const PHI = t(
  'La cota exacta es φⁿ ≈ 1,618ⁿ, que está dentro de O(2ⁿ).',
  'The tight bound is φⁿ ≈ 1.618ⁿ, which is within O(2ⁿ).',
);

export const FINAL = (label: string) =>
  t(
    `Descartamos constantes y términos menores: ${label}.`,
    `We drop constants and lower-order terms: ${label}.`,
  );

export const NOTE = {
  linear: t('n veces', 'n times'),
  linearStep2: t('n/2 veces', 'n/2 times'),
  constant: (k: number) => t(`${k} veces`, `${k} times`),
  dependent: t('i veces', 'i times'),
  log: t('log n veces', 'log n times'),
  logOuter: t('log i veces', 'log i times'),
  twoCalls: t('dos llamadas por nivel', 'two calls per level'),
  halfCalls: (c: number) =>
    c === 1 ? t('una llamada con n/2', 'one call with n/2') : t(`${c} llamadas con n/2`, `${c} calls with n/2`),
  nCalls: t('n llamadas con n − 1', 'n calls with n − 1'),
};

export const RECURSION_STEP = {
  dcWork: {
    constant: (lines: readonly number[], k: number) =>
      t(
        `Cada llamada hace ${k} operaciones en el loop de la línea ${lines[0]}, sin importar n.`,
        `Each call does ${k} operations in the loop on line ${lines[0]}, whatever n is.`,
      ),
    linear: (lines: readonly number[]) =>
      t(
        `Cada llamada recorre n elementos en la línea ${lines[0]}.`,
        `Each call goes through n elements on line ${lines[0]}.`,
      ),
    quadratic: (lines: readonly number[]) =>
      t(
        `Cada llamada recorre n × n elementos con los loops de las líneas ${lines.join(' y ')}.`,
        `Each call goes through n × n elements with the loops on lines ${lines.join(' and ')}.`,
      ),
    cubic: (lines: readonly number[]) =>
      t(
        `Cada llamada recorre n × n × n elementos con los loops de las líneas ${lines.join(', ')}.`,
        `Each call goes through n × n × n elements with the loops on lines ${lines.join(', ')}.`,
      ),
  },
  dcLevels: {
    '1-unit': t(
      'Hace una llamada con n/2: hay log₂ n niveles de trabajo constante.',
      'It makes one call with n/2: there are log₂ n levels of constant work.',
    ),
    '1-linear': t(
      'Hace una llamada con n/2: el trabajo baja n + n/2 + n/4 + … ≈ 2n.',
      'It makes one call with n/2: the work goes n + n/2 + n/4 + … ≈ 2n.',
    ),
    '1-cubic': t(
      'Hace una llamada con n/2: el trabajo baja n³ + (n/2)³ + … y el primer nivel domina: n³.',
      'It makes one call with n/2: the work goes n³ + (n/2)³ + … and the first level dominates: n³.',
    ),
    '2-constant': t(
      'Hace 2 llamadas con n/2: las llamadas se duplican en cada nivel, hay ≈ n hojas y el trabajo total es proporcional a n.',
      'It makes 2 calls with n/2: calls double on each level, there are ≈ n leaves and the total work is proportional to n.',
    ),
    '2-linear': t(
      'Hace 2 llamadas con n/2: hay log₂ n niveles y cada nivel suma n.',
      'It makes 2 calls with n/2: there are log₂ n levels and each level adds n.',
    ),
    '2-quadratic': t(
      'Hace 2 llamadas con n/2: el trabajo por nivel baja a la mitad (n², n²/2, …) y el primero domina: n².',
      'It makes 2 calls with n/2: the work per level halves (n², n²/2, …) and the first one dominates: n².',
    ),
    '4-unit': t(
      'Hace 4 llamadas con n/2: las llamadas se cuadruplican en cada nivel, hay ≈ n² hojas.',
      'It makes 4 calls with n/2: calls quadruple on each level, there are ≈ n² leaves.',
    ),
  } as Record<string, Localized>,
  doubleCalls: (line: number, second: 'n - 2' | 'n - 1') =>
    t(
      `Cada llamada con n suficientemente grande hace dos llamadas más, f(n - 1) y f(${second}), en la línea ${line}.`,
      `Each call with a large enough n makes two more calls, f(n - 1) and f(${second}), on line ${line}.`,
    ),
  doubleTree: t(
    'El árbol de llamadas casi duplica sus llamadas en cada nivel: crece de forma exponencial.',
    'The call tree almost doubles its calls on each level: it grows exponentially.',
  ),
  doubleTreeEqual: t(
    'El árbol de llamadas duplica sus llamadas en cada uno de sus n niveles: hay ≈ 2ⁿ hojas.',
    'The call tree doubles its calls on each of its n levels: there are ≈ 2ⁿ leaves.',
  ),
  extraWork: (line: number, k: number) =>
    t(
      `Cada llamada hace además ${k} operaciones en la línea ${line}, que no cambian el crecimiento.`,
      `Each call also does ${k} operations on line ${line}, which do not change the growth.`,
    ),
  permutationsLoop: (line: number) =>
    t(
      `El loop de la línea ${line} corre n veces y en cada vuelta llama a f con n − 1.`,
      `The loop on line ${line} runs n times and calls f with n − 1 on each iteration.`,
    ),
  permutationsTree: t(
    'El árbol de llamadas tiene n × (n − 1) × (n − 2) × … × 1 hojas: n! llamadas.',
    'The call tree has n × (n − 1) × (n − 2) × … × 1 leaves: n! calls.',
  ),
  permutationsExtra: t(
    'Además cada llamada hace un trabajo propio por vuelta, que no cambia el factorial.',
    'Each call also does its own work per iteration, which does not change the factorial.',
  ),
};

export const TIP_TRAP: Record<TrapKind, (trap: string) => Localized> = {
  sequential_loops: (trap) =>
    t(
      `La trampa más común es ver varios loops y responder ${trap}: uno después del otro se suman, no se multiplican.`,
      `The most common trap is to see several loops and answer ${trap}: one after the other they add up, they don't multiply.`,
    ),
  constant_bound: (trap) =>
    t(
      `Un loop que corre hasta una constante no depende de n: cuenta como O(1), por grande que sea la constante. Responder ${trap} es la trampa.`,
      `A loop that runs up to a constant does not depend on n: it counts as O(1), however large the constant. Answering ${trap} is the trap.`,
    ),
  doubling_inner: (trap) =>
    t(
      `La trampa más común es ver dos loops anidados y responder ${trap}: el de adentro duplica su variable, así que corre log n veces, no n.`,
      `The most common trap is to see two nested loops and answer ${trap}: the inner one doubles its variable, so it runs log n times, not n.`,
    ),
};

export const TIP_CATEGORY: Record<RecipeCategory, Localized> = {
  simple_loops: t(
    'Para un loop, preguntate cómo cambia su variable: sumar una constante da n vueltas; multiplicar o dividir por 2 da log n.',
    'For a loop, ask how its variable changes: adding a constant gives n iterations; multiplying or dividing by 2 gives log n.',
  ),
  nested_loops: t(
    'En loops anidados se multiplican las vueltas de cada nivel; si el de adentro depende del de afuera, sumá nivel por nivel.',
    'In nested loops the iterations of each level multiply; if the inner one depends on the outer one, add them up level by level.',
  ),
  recursion: t(
    'En una recursión, dibujá el árbol de llamadas: cuántas llamadas abre cada una y cuántos niveles tiene.',
    'For recursion, draw the call tree: how many calls each one opens and how many levels it has.',
  ),
  divide_and_conquer: t(
    'Al partir n a la mitad hay log n niveles: compará el trabajo de cada nivel con la cantidad de niveles.',
    'Halving n gives log n levels: compare the work per level with the number of levels.',
  ),
  binary_search: t(
    'Si cada vuelta descarta la mitad del rango, llegás a un solo elemento en log₂ n pasos.',
    'If each iteration discards half of the range, you reach a single element in log₂ n steps.',
  ),
};
