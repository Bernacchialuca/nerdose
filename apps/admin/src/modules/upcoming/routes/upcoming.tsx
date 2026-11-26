import { useEffect, useRef, useState } from 'react';

import { Alert, Badge, Panel, buttonClass } from '@nerdose/ui';

import { usePageTitle } from '@/hooks/use-page-title';

import { useUpcoming } from '../api/use-upcoming';
import { LEGEND, windowSubtitle } from '../cell-state';
import { RegenerateDialog } from '../components/regenerate-dialog';
import type { RegenerateTarget } from '../components/regenerate-dialog';
import { UpcomingAlerts } from '../components/upcoming-alerts';
import { UpcomingChallengeDrawer } from '../components/upcoming-challenge-drawer';
import { UpcomingGrid } from '../components/upcoming-grid';
import type { CellRef } from '../components/upcoming-grid';

export function Component() {
  const headingRef = usePageTitle('Próximos · Admin · nerdose');
  const query = useUpcoming();
  const [selected, setSelected] = useState<CellRef | null>(null);
  const [regenTarget, setRegenTarget] = useState<RegenerateTarget | null>(null);
  // Pedidos de foco: un objeto nuevo por pedido, para que el efecto corra sin tener que reiniciarlo.
  const [focusRequest, setFocusRequest] = useState<{ cell: string | null } | null>(null);
  const openRefs = useRef(new Map<string, HTMLButtonElement>());

  const data = query.data;

  // La celda abierta vive con la data del polling: si cambia el desafío se ve el nuevo.
  const day = selected ? data?.days.find((d) => d.date === selected.date) : undefined;
  const game = selected ? day?.games.find((g) => g.game_id === selected.game_id) : undefined;
  const challenge = game?.challenge ?? null;
  const drawerOpen = day !== undefined && game !== undefined && challenge !== null;

  // Si el día sale de la ventana (llegó su fecha) el detalle se cierra y el foco vuelve al título.
  if (selected !== null && data !== undefined && !drawerOpen) {
    setSelected(null);
    setFocusRequest({ cell: null });
  }

  useEffect(() => {
    if (focusRequest === null) return;
    const target =
      focusRequest.cell === null ? headingRef.current : openRefs.current.get(focusRequest.cell);
    target?.focus();
  }, [focusRequest, headingRef]);

  let content;
  if (data) {
    content = <UpcomingGrid data={data} openRefs={openRefs} onOpen={setSelected} />;
  } else if (query.isError) {
    content = (
      <Alert
        title="No pudimos cargar los próximos desafíos. Probá de nuevo."
        action={
          <button
            type="button"
            onClick={() => {
              void query.refetch();
            }}
            className={buttonClass({ variant: 'secondary' })}
          >
            Reintentar
          </button>
        }
      />
    );
  } else {
    content = <p role="status">Cargando próximos desafíos…</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 ref={headingRef} tabIndex={-1} className="font-mono text-title-page text-text">
          Próximos desafíos
        </h1>
        {data ? (
          <p className="font-sans text-body-sm text-text-muted">{windowSubtitle(data)}</p>
        ) : null}
      </div>
      <Panel title="Próximos 14 días">
        <ul aria-label="Estados de una celda" className="flex flex-wrap gap-2">
          {LEGEND.map((item) => (
            <li key={item.text}>
              <Badge variant="chip">
                <span aria-hidden="true">{item.glyph}&nbsp;</span>
                {item.text}
              </Badge>
            </li>
          ))}
        </ul>
        <UpcomingAlerts data={data} />
        {content}
      </Panel>
      {drawerOpen ? (
        <UpcomingChallengeDrawer
          day={day}
          game={game}
          challenge={challenge}
          onClose={() => {
            setSelected(null);
          }}
          onRegenerate={() => {
            setRegenTarget({
              challenge_id: challenge.id,
              game_id: game.game_id,
              number: day.number,
              date: day.date,
            });
          }}
        />
      ) : null}
      {regenTarget ? (
        <RegenerateDialog
          target={regenTarget}
          onClose={() => {
            setRegenTarget(null);
          }}
          onRequested={() => {
            setRegenTarget(null);
          }}
          onGone={() => {
            setRegenTarget(null);
            setSelected(null);
          }}
        />
      ) : null}
    </>
  );
}
