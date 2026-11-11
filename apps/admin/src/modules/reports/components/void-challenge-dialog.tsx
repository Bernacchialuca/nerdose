import { useId, useRef, useState } from 'react';

import { Alert, Banner, linkClass } from '@nerdose/ui';

import { dangerButtonClass } from '@/components/danger-button';
import { Dialog } from '@/components/dialog';
import { SelectField, TextAreaField } from '@/components/form-field';
import { isApiError } from '@/lib/api-errors';

import type { AdminChallenge, VoidCulprit } from '../api/types';
import { useVoidChallenge } from '../api/use-void-challenge';
import { CHALLENGE_STATUS_LABELS, CULPRIT_KIND_LABELS, challengeLabel } from '../labels';

import { voidSummary } from './void-summary';
import type { VoidChoice } from './void-summary';

type VoidChallengeDialogProps = {
  challenge: AdminChallenge;
  onClose: () => void;
  onGone: () => void;
  onVoided: (result: { label: string; affected_plays: number }) => void;
};

const REASON_ERROR = 'Contá por qué se anula el desafío.';
const CULPRIT_ERROR = 'Elegí el culpable del error.';
const CONFLICT_TEXT = {
  not_voidable:
    'Este desafío ya no se puede anular: ya está anulado o no está publicado. Cerrá y revisá su estado en Reportes.',
  invalid_culprit: 'El culpable elegido no corresponde a este desafío. Elegí otro.',
} as const;

export function VoidChallengeDialog({
  challenge,
  onClose,
  onGone,
  onVoided,
}: VoidChallengeDialogProps) {
  const summaryId = useId();
  const reasonRef = useRef<HTMLTextAreaElement>(null);
  const culpritRef = useRef<HTMLSelectElement>(null);
  const voidMutation = useVoidChallenge();
  const [reason, setReason] = useState('');
  const [selected, setSelected] = useState('');
  const [errors, setErrors] = useState<{ reason?: string; culprit?: string }>({});
  const [conflict, setConflict] = useState<keyof typeof CONFLICT_TEXT | null>(null);
  const [system, setSystem] = useState(false);

  const label = challengeLabel(challenge);
  const pending = voidMutation.isPending;
  const notVoidable = conflict === 'not_voidable';
  const blocked = pending || notVoidable;

  const culpritItem = challenge.culprits.find((c) => `${c.kind}:${c.id}` === selected);
  const choice: VoidChoice = culpritItem
    ? { kind: culpritItem.kind, label: culpritItem.label }
    : selected === 'template' || selected === 'none'
      ? { kind: selected }
      : null;
  const summary = voidSummary(label, choice);

  const submit = () => {
    if (blocked) return;
    const next: { reason?: string; culprit?: string } = {};
    if (reason.trim() === '') next.reason = REASON_ERROR;
    if (selected === '') next.culprit = CULPRIT_ERROR;
    setErrors(next);
    setConflict(null);
    setSystem(false);
    if (next.reason) {
      reasonRef.current?.focus();
      return;
    }
    if (next.culprit) {
      culpritRef.current?.focus();
      return;
    }
    const culprit: VoidCulprit = culpritItem
      ? { kind: culpritItem.kind, id: culpritItem.id }
      : { kind: selected as 'template' | 'none' };
    voidMutation.mutate(
      { challenge_id: challenge.id, void_reason: reason.trim(), culprit },
      {
        onSuccess: (result) => {
          onVoided({ label, affected_plays: result.affected_plays });
        },
        onError: (error) => {
          if (isApiError(error, 'not_voidable')) setConflict('not_voidable');
          else if (isApiError(error, 'invalid_culprit')) setConflict('invalid_culprit');
          else if (isApiError(error, 'validation_error')) setErrors({ reason: REASON_ERROR });
          else if (isApiError(error, 'not_found')) onGone();
          else if (!(isApiError(error) && error.status === 401)) setSystem(true);
        },
      },
    );
  };

  return (
    <Dialog
      variant="modal"
      title="Anular desafío"
      onClose={onClose}
      closeDisabled={pending}
      initialFocusRef={reasonRef}
    >
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col gap-4"
      >
        <p className="font-sans text-body text-text-body">
          {label} · {challenge.date} · {CHALLENGE_STATUS_LABELS[challenge.status]}
        </p>
        <TextAreaField
          label="Motivo de la anulación"
          textareaRef={reasonRef}
          maxLength={500}
          placeholder="Ej.: definición incorrecta"
          value={reason}
          error={errors.reason}
          onChange={(event) => {
            setReason(event.target.value);
          }}
        />
        <SelectField
          label="Culpable del error"
          selectRef={culpritRef}
          value={selected}
          error={errors.culprit}
          onChange={(event) => {
            setSelected(event.target.value);
            setConflict((c) => (c === 'invalid_culprit' ? null : c));
          }}
        >
          <option value="" disabled>
            Elegí un culpable
          </option>
          {challenge.culprits.map((c) => (
            <option key={c.id} value={`${c.kind}:${c.id}`}>
              {CULPRIT_KIND_LABELS[c.kind]} · {c.label}
            </option>
          ))}
          <option value="template">La plantilla del juego</option>
          <option value="none">Ninguno (no se identifica un culpable)</option>
        </SelectField>
        <div id={summaryId}>
          <Banner variant="warning" announce={false}>
            <span className="block">{summary.text}</span>
            {summary.footnote ? <span className="mt-2 block">{summary.footnote}</span> : null}
          </Banner>
        </div>
        {conflict ? (
          <div role="alert">
            <Banner variant="warning" announce={false} title={CONFLICT_TEXT[conflict]} />
          </div>
        ) : null}
        {system ? (
          <Alert title="No pudimos anular el desafío. No se aplicó ningún cambio: recargá Reportes y verificá su estado antes de reintentar." />
        ) : null}
        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            aria-disabled={pending || undefined}
            onClick={() => {
              if (!pending) onClose();
            }}
            className={linkClass({ tone: 'subtle' })}
          >
            Cancelar
          </button>
          <button
            type="submit"
            aria-disabled={blocked || undefined}
            aria-describedby={summaryId}
            className={dangerButtonClass({ disabled: blocked })}
          >
            {pending ? 'Anulando…' : 'Anular desafío'}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
