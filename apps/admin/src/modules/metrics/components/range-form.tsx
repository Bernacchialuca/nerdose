import { buttonClass } from '@nerdose/ui';

import { TextField } from '@/components/form-field';

import type { MetricsRange, RangeProblem } from '../range';

type Props = {
  draft: MetricsRange;
  onChange: (next: MetricsRange) => void;
  problem: RangeProblem | null;
  alertId: string;
  busy: boolean;
  onSubmit: () => void;
};

export function RangeForm({ draft, onChange, problem, alertId, busy, onSubmit }: Props) {
  const disabled = problem !== null || busy;
  const describedBy = problem ? alertId : undefined;
  return (
    <form
      noValidate
      className="grid gap-4 lg:grid-cols-12 lg:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) onSubmit();
      }}
    >
      <div className="lg:col-span-3">
        <TextField
          type="date"
          label="Desde"
          value={draft.from}
          invalid={problem?.invalid.includes('from') ?? false}
          describedBy={problem?.invalid.includes('from') ? describedBy : undefined}
          onChange={(event) => {
            onChange({ ...draft, from: event.target.value });
          }}
        />
      </div>
      <div className="lg:col-span-3">
        <TextField
          type="date"
          label="Hasta"
          value={draft.to}
          invalid={problem?.invalid.includes('to') ?? false}
          describedBy={problem?.invalid.includes('to') ? describedBy : undefined}
          onChange={(event) => {
            onChange({ ...draft, to: event.target.value });
          }}
        />
      </div>
      <div className="lg:col-span-2">
        <button
          type="submit"
          aria-disabled={disabled ? 'true' : undefined}
          className={buttonClass({ variant: 'primary', disabled })}
        >
          {busy ? 'Consultando…' : 'Consultar'}
        </button>
      </div>
      <p className="font-sans text-caption text-text-muted lg:col-span-4">
        Fechas en UTC · hasta 366 días · sin fechas futuras
      </p>
    </form>
  );
}
