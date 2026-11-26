import type { ContentStockResponse } from '../api/types';
import { stockAlerts } from '../stock-model';
import { BankPanel } from './bank-panel';
import { BankRejectionsLink } from './bank-rejections-link';
import { LastSyncPanel } from './last-sync-panel';
import { StockAlerts } from './stock-alerts';
import { TopRejectedPanel } from './top-rejected-panel';

export function StockContent({ data }: { data: ContentStockResponse }) {
  return (
    <>
      <StockAlerts alerts={stockAlerts(data)} />
      <LastSyncPanel lastSync={data.last_sync} />
      <div className="grid grid-cols-1 gap-6">
        {data.banks.map((bank) => (
          <BankPanel key={bank.bank} bank={bank} />
        ))}
      </div>
      <BankRejectionsLink banks={data.banks} />
      <TopRejectedPanel guesses={data.top_rejected_guesses} />
    </>
  );
}
