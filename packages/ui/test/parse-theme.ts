/// <reference types="node" />
import { readFileSync } from 'node:fs';

export const tokensRaw = readFileSync(new URL('../src/tokens.css', import.meta.url), 'utf8');
export const tokensCss = tokensRaw.replace(/\/\*[\s\S]*?\*\//g, '');

/** Cuerpo de un bloque `{...}` que empieza en `start` (conteo de llaves). */
function blockFrom(css: string, open: number): { body: string; end: number } {
  let depth = 0;
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      depth--;
      if (depth === 0) return { body: css.slice(open + 1, i), end: i + 1 };
    }
  }
  throw new Error('unbalanced braces');
}

const themeMatch = /@theme\s*\{/.exec(tokensCss);
const themeOpen = themeMatch ? themeMatch.index + themeMatch[0].length - 1 : -1;
const theme = blockFrom(tokensCss, themeOpen);

/** Todo lo que hay fuera del bloque `@theme`. */
export const outsideTheme = tokensCss.slice(0, themeMatch?.index ?? 0) + tokensCss.slice(theme.end);

export const themeBody = theme.body;

/** Declaraciones de primer nivel de `@theme`, ignorando el contenido de `@keyframes`. */
export function parseTheme(): Record<string, string> {
  let flat = '';
  let depth = 0;
  for (const ch of themeBody) {
    if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (depth === 0) flat += ch;
  }
  return Object.fromEntries(
    [...flat.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map(([, name, value]) => [
      name,
      value?.trim(),
    ]),
  );
}

export const declarations = parseTheme();
