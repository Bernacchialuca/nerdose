# Utils

## cn
- **Location:** packages/ui/src/cn.ts
- **Description:** Merges class names with clsx and resolves Tailwind conflicts with tailwind-merge. Never concatenate class strings by hand.
- **Signature:** `cn(...inputs: ClassValue[]): string`
- **Usage:** `cn('bg-surface', isActive && 'bg-bg')`
