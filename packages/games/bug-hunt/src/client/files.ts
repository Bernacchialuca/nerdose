import type { CodeLanguage } from '@nerdose/core';

/** File name shown next to the tabs, by the convention of each language (function names are camelCase). */
export function fileNames(name: string): Record<CodeLanguage, string> {
  const kebab = name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
  const snake = name.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  const pascal = name.charAt(0).toUpperCase() + name.slice(1);
  return { js: `${kebab}.js`, go: `${snake}.go`, java: `${pascal}.java` };
}
