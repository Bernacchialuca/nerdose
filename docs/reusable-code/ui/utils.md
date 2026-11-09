# Utils

## cn
- **Location:** packages/ui/src/cn.ts
- **Description:** Merges class names with clsx and resolves Tailwind conflicts with a `tailwind-merge` instance extended (`extendTailwindMerge`) with the theme roles of `src/theme.ts` (`TEXT_ROLES`, `RADIUS_ROLES`, `SHADOW_ROLES`), so `text-display-hero` survives next to a text color and `rounded-control` / `rounded-panel` conflict. Never concatenate class strings by hand. The lists in `theme.ts` must match `tokens.css` (checked by `test/cn.test.ts`).
- **Signature:** `cn(...inputs: ClassValue[]): string`
- **Usage:** `cn('text-display-hero', isActive ? 'text-streak' : 'text-text-dim')`

## injectAnalytics
- **Location:** packages/ui/src/analytics.ts
- **Description:** Injects the Plausible `<script defer data-domain src>` into `document.head` only when both `domain` and `scriptUrl` are non-empty, and installs the queue stub so early events are not lost. Idempotent. `ui` never reads `import.meta.env`: the app passes the values.
- **Signature:** `injectAnalytics(options: { domain: string | undefined; scriptUrl: string | undefined }): void`
- **Usage:** `injectAnalytics({ domain: env.plausibleDomain, scriptUrl: env.plausibleScriptUrl })`

## track
- **Location:** packages/ui/src/analytics.ts
- **Description:** Sends the typed event `share:<game_id>` with no properties (ADR-014). No-op until `injectAnalytics` enabled analytics; never throws.
- **Signature:** `track(event: AnalyticsEvent): void` where `AnalyticsEvent` is the template type `share:${UiGameId}`
- **Usage:** `track('share:devdle')`
