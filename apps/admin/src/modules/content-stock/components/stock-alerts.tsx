import { Banner } from '@nerdose/ui';

export function StockAlerts({ alerts }: { alerts: string[] }) {
  if (alerts.length === 0) return null;
  return (
    <div className="flex flex-col gap-3">
      {alerts.map((text) => (
        <Banner key={text} variant="warning" title={text} />
      ))}
    </div>
  );
}
