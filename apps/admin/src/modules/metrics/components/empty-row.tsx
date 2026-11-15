import { dataTableClass } from '@nerdose/ui';

import { EMPTY_RANGE } from '../metrics-model';

export function EmptyRow({ colSpan }: { colSpan: number }) {
  return (
    <tr>
      <td colSpan={colSpan} className={dataTableClass().td}>
        {EMPTY_RANGE}
      </td>
    </tr>
  );
}
