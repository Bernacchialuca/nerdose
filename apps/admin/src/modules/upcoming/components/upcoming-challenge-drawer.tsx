import { Badge, Banner, buttonClass } from '@nerdose/ui';

import { Dialog } from '@/components/dialog';
import { formatTime } from '@/lib/format-date';
import {
  CHALLENGE_STATUS_LABELS,
  GAME_LABELS,
  PayloadCommon,
  VerificationLog,
  challengeLabel,
} from '@/modules/reports';

import type { UpcomingChallenge, UpcomingDay, UpcomingGame } from '../api/types';

import { ChallengePreview } from './challenge-preview';

type UpcomingChallengeDrawerProps = {
  day: UpcomingDay;
  game: UpcomingGame;
  challenge: UpcomingChallenge;
  onClose: () => void;
  onRegenerate: (trigger: HTMLElement) => void;
};

const at = (prefix: string, iso: string | null): string =>
  iso === null ? '' : `${prefix} ${formatTime(iso)}`;

function RejectedNotice({ challenge }: { challenge: UpcomingChallenge }) {
  const tail = 'No se regenera solo: regeneralo si no querés publicarlo.';
  const [only, ...rest] = challenge.rejected_items;
  if (!only) return null;
  if (rest.length === 0) {
    return (
      <Banner
        variant="warning"
        announce={false}
        title={`Este desafío usa un ítem rechazado: ${only.label} (${only.rejection_reason}). ${tail}`}
      />
    );
  }
  return (
    <Banner variant="warning" announce={false} title={`Este desafío usa ítems rechazados. ${tail}`}>
      <ul>
        {challenge.rejected_items.map((item) => (
          <li key={item.id}>
            {item.label} ({item.rejection_reason})
          </li>
        ))}
      </ul>
    </Banner>
  );
}

export function UpcomingChallengeDrawer({
  day,
  game,
  challenge,
  onClose,
  onRegenerate,
}: UpcomingChallengeDrawerProps) {
  const regeneration = game.regeneration;
  const pending = regeneration?.status === 'pending';
  const failed = regeneration?.status === 'failed';
  const rejected = challenge.rejected_items.length > 0;

  return (
    <Dialog
      variant="drawer"
      title={challengeLabel({ game_id: game.game_id, number: day.number })}
      onClose={onClose}
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{GAME_LABELS[game.game_id]}</Badge>
            <Badge>#{day.number}</Badge>
            <Badge>{day.date}</Badge>
            <Badge>{CHALLENGE_STATUS_LABELS[challenge.status]}</Badge>
            {pending ? (
              <Badge tone="pending" strong>
                regenerando…
              </Badge>
            ) : null}
            {failed ? <Badge tone="pending">regeneración fallida</Badge> : null}
            {rejected ? <Badge tone="pending">usa un ítem rechazado</Badge> : null}
          </div>
          <div aria-live="polite" className="flex flex-col gap-3 empty:hidden">
            {rejected ? <RejectedNotice challenge={challenge} /> : null}
            {pending && regeneration ? (
              <Banner
                variant="neutral"
                announce={false}
                title={`Regeneración pendiente${at(' desde las', regeneration.requested_at)}. Mientras tanto este desafío sigue aprobado y se publica tal cual si llega su fecha.`}
              />
            ) : null}
            {failed && regeneration ? (
              <Banner
                variant="failure"
                announce={false}
                title={`La última regeneración falló${at(' a las', regeneration.processed_at)}: ningún reemplazo pasó la verificación${regeneration.error === null ? '' : ` (${regeneration.error})`}. Queda este desafío.`}
              />
            ) : null}
          </div>
          <p className="font-mono text-label-comment text-text-dim">
            Intento {challenge.attempt} · generator {challenge.generator_version}
          </p>
        </div>

        <ChallengePreview key={challenge.id} gameId={game.game_id} payload={challenge.payload} />
        <PayloadCommon payload={challenge.payload} />
        <VerificationLog verification={challenge.verification} />

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            aria-disabled={pending || undefined}
            onClick={(event) => {
              if (!pending) onRegenerate(event.currentTarget);
            }}
            className={buttonClass({ variant: 'primary', disabled: pending })}
          >
            {pending ? 'Regenerando…' : 'Regenerar'}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
