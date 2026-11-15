import { Card } from '@nerdose/ui';

import { formatCount } from '@/lib/format-number';

import type { MetricsSummary } from '../api/types';
import { formatPercent } from '../metrics-model';

export function SummaryFigures({ summary }: { summary: MetricsSummary }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card
        variant="mini-stat"
        value={formatCount(summary.unique_players)}
        label="Jugadores únicos"
      />
      <Card variant="mini-stat" value={formatPercent(summary.d1)} label="Retención D1" />
      <Card variant="mini-stat" value={formatPercent(summary.d7)} label="Retención D7" />
      <Card
        variant="mini-stat"
        value={formatCount(summary.completed)}
        label="Partidas completadas"
      />
    </div>
  );
}
