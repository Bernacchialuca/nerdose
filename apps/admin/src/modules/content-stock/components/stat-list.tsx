import type { ReactNode } from 'react';

export type StatPair = { label: string; value: ReactNode };

export function StatList({ pairs }: { pairs: StatPair[] }) {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2 font-mono text-mono-body">
      {pairs.map((p) => (
        <div key={p.label} className="flex gap-2">
          <dt className="text-text-dim">{p.label}</dt>
          <dd className="text-text">{p.value}</dd>
        </div>
      ))}
    </dl>
  );
}
