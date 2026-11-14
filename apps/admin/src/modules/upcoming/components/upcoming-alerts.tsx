import { Banner } from '@nerdose/ui';

import type { UpcomingResponse } from '../api/types';
import { upcomingAlerts } from '../cell-state';

/** La región viva existe siempre: los avisos que aparecen dentro se anuncian de forma fiable. */
export function UpcomingAlerts({ data }: { data: UpcomingResponse | undefined }) {
  const alerts = upcomingAlerts(data);
  return (
    <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
      {alerts.failures ? (
        <Banner variant="warning" announce={false} title={alerts.failures} />
      ) : null}
      {alerts.pending ? (
        <Banner
          variant="neutral"
          announce={false}
          title="Hay una regeneración en curso. La grilla se actualiza sola cada 5 segundos."
        />
      ) : null}
      {alerts.regenFailed.length > 0 ? (
        <Banner variant="failure" announce={false}>
          {alerts.regenFailed.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </Banner>
      ) : null}
    </div>
  );
}
