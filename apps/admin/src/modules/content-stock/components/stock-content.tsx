import type { ContentStockResponse } from '../api/types';
import { rejectionRows, stockAlerts } from '../stock-model';
import { BankPanel } from './bank-panel';
import { BankRejectionsPanel } from './bank-rejections-panel';
import { LastSyncPanel } from './last-sync-panel';
import { StockAlerts } from './stock-alerts';
import { TopRejectedPanel } from './top-rejected-panel';

export function StockContent({ data }: { data: ContentStockResponse }) {
  return (
    <>
      <StockAlerts alerts={stockAlerts(data)} />
      <LastSyncPanel lastSync={data.last_sync} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {data.banks.map((bank) => (
          <BankPanel key={bank.bank} bank={bank} />
        ))}
      </div>
      <BankRejectionsPanel rows={rejectionRows(data)} />
      <TopRejectedPanel guesses={data.top_rejected_guesses} />
    </>
  );
}
