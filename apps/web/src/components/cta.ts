// Button del DS web (docs/design-system/web/components/button.md).
export const FOCUS =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';

const BASE = 'inline-flex min-h-11 items-center justify-center gap-2 px-4';

export const CTA_PRIMARY = `${BASE} bg-accent font-bold text-on-accent ${FOCUS}`;
export const CTA_SECONDARY = `${BASE} border border-border-interactive text-accent ${FOCUS}`;
export const CTA_DISABLED = `${BASE} border border-border text-text-dim ${FOCUS}`;
