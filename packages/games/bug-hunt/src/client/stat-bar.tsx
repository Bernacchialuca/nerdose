import type { CSSProperties } from 'react';

export function StatBar({ rate }: { rate: number | null }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-track" aria-hidden="true">
      <div
        className="h-full w-(--w) rounded-full bg-game-bug-hunt"
        style={{ '--w': `${Math.round((rate ?? 0) * 100)}%` } as CSSProperties}
      />
    </div>
  );
}
