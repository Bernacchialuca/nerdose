import type { MetricsResponse } from '../api/types';
import type { MetricsRange } from '../range';
import { DailyPlayersTable } from './daily-players-table';
import { QualityTable } from './quality-table';
import { RetentionTable } from './retention-table';
import { StreakTable } from './streak-table';
import { SummaryFigures } from './summary-figures';

export function MetricsContent({ data, range }: { data: MetricsResponse; range: MetricsRange }) {
  return (
    <>
      <SummaryFigures summary={data.summary} />
      <DailyPlayersTable daily={data.daily_players} from={range.from} to={range.to} />
      <div className="grid gap-6 lg:grid-cols-12">
        <RetentionTable retention={data.retention} className="lg:col-span-7" />
        <StreakTable distribution={data.streak_distribution} className="lg:col-span-5" />
      </div>
      <QualityTable quality={data.challenge_quality} />
    </>
  );
}
