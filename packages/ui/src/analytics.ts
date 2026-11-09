import type { UiGameId } from './components/game-classes';

/** Eventos permitidos (ADR-014): solo `share:<game_id>`, sin propiedades. */
export type AnalyticsEvent = `share:${UiGameId}`;

type Plausible = ((...args: unknown[]) => void) & { q?: unknown[] };

declare global {
  interface Window {
    plausible?: Plausible;
  }
}

let enabled = false;

/** Inyecta el script de Plausible solo si hay dominio y URL. Idempotente. */
export function injectAnalytics({
  domain,
  scriptUrl,
}: {
  domain: string | undefined;
  scriptUrl: string | undefined;
}): void {
  if (!domain || !scriptUrl || enabled) return;
  // Stub de cola del snippet de Plausible: encola hasta que cargue el script real.
  window.plausible =
    window.plausible ??
    function (...args: unknown[]) {
      const queue = window.plausible as Plausible;
      (queue.q = queue.q ?? []).push(args);
    };
  const script = document.createElement('script');
  script.defer = true;
  script.dataset.domain = domain;
  script.src = scriptUrl;
  document.head.appendChild(script);
  enabled = true;
}

/** Envía `share:<game_id>`. No-op si la analítica está apagada; nunca lanza. */
export function track(event: AnalyticsEvent): void {
  if (!enabled) return;
  try {
    window.plausible?.(event);
  } catch {
    /* la analítica nunca rompe la app (ADR-014) */
  }
}
