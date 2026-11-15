import type { CSSProperties } from 'react';

/**
 * Shiki's `css-variables` theme emits `var(--shiki-…)` colors. Defining those variables here, on the
 * block's own `style`, maps them to DS tokens: no hex, no CSS file and no Shiki markup in the DOM.
 */
export const SHIKI_VARS = {
  '--shiki-foreground': 'var(--color-text)',
  '--shiki-background': 'var(--color-surface-sunken)',
  '--shiki-token-keyword': 'var(--color-game-bug-hunt)',
  '--shiki-token-function': 'var(--color-game-bug-hunt-light)',
  '--shiki-token-constant': 'var(--color-text-lede)',
  '--shiki-token-parameter': 'var(--color-text)',
  '--shiki-token-string': 'var(--color-text-body)',
  '--shiki-token-string-expression': 'var(--color-text-body)',
  '--shiki-token-comment': 'var(--color-text-dim)',
  '--shiki-token-punctuation': 'var(--color-text-muted)',
  '--shiki-token-link': 'var(--color-game-bug-hunt-light)',
} as CSSProperties;
