# Utils

## cn
- **Location:** packages/ui/src/cn.ts
- **Description:** Merges class names with clsx and resolves Tailwind conflicts with a `tailwind-merge` instance extended (`extendTailwindMerge`) with the theme roles of `src/theme.ts` (`TEXT_ROLES`, `RADIUS_ROLES`, `SHADOW_ROLES`), so `text-display-hero` survives next to a text color and `rounded-control` / `rounded-panel` conflict. Never concatenate class strings by hand. The lists in `theme.ts` must match `tokens.css` (checked by `test/cn.test.ts`).
- **Signature:** `cn(...inputs: ClassValue[]): string`
