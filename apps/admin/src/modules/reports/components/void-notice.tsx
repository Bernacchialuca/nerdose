import { forwardRef } from 'react';

import { Banner, buttonClass } from '@nerdose/ui';

export type VoidNoticeData = { label: string; affected_plays: number };

type VoidNoticeProps = { notice: VoidNoticeData; onDismiss: () => void };

export const VoidNotice = forwardRef<HTMLDivElement, VoidNoticeProps>(function VoidNotice(
  { notice, onDismiss },
  ref,
) {
  return (
    <div ref={ref} tabIndex={-1}>
      <Banner
        variant="success"
        title={`${notice.label} anulado · ${notice.affected_plays} ${notice.affected_plays === 1 ? 'partida afectada' : 'partidas afectadas'}.`}
        action={
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={onDismiss}
            className={buttonClass({ variant: 'icon' })}
          >
            <span aria-hidden="true">✕</span>
          </button>
        }
      >
        Los reportes abiertos quedaron resueltos.
      </Banner>
    </div>
  );
});
