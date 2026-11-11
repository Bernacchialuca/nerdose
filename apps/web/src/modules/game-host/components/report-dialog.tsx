import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { REPORT_REASONS } from '@nerdose/core';
import type { GameId, ReportReason } from '@nerdose/core';
import {
  Alert,
  Banner,
  buttonClass,
  cn,
  Dialog,
  linkClass,
  SelectField,
  TextAreaField,
} from '@nerdose/ui';

import { ApiError } from '@/lib/api-client';

import { useReport } from '../api/use-report';

const MAX_MESSAGE = 1000;
const ANNOUNCE_FROM = 900;

type Phase = 'form' | 'success' | 'already';
type SystemError = 'error' | 'rateLimited' | null;

export type ReportDialogProps = {
  gameId: GameId;
  /** Número del desafío visto al abrir: el reporte sale con él aunque el día cambie (D1). */
  number: number;
  /** `game` muestra el aviso anti-spoiler. */
  from: 'game' | 'result';
  /** Recibe `true` si el reporte quedó registrado (éxito o `already_reported`). */
  onClose: (reported: boolean) => void;
};

/** O-01: formulario de reporte dentro del `Dialog` del DS, con sus fases y errores. */
export function ReportDialog({ gameId, number, from, onClose }: ReportDialogProps) {
  const { t } = useTranslation();
  const report = useReport(gameId);
  const selectRef = useRef<HTMLSelectElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [phase, setPhase] = useState<Phase>('form');
  const [reason, setReason] = useState<ReportReason | ''>('');
  const [message, setMessage] = useState('');
  const [reasonError, setReasonError] = useState(false);
  const [messageError, setMessageError] = useState(false);
  const [systemError, setSystemError] = useState<SystemError>(null);
  const pending = report.isPending;

  // Los campos y el botón enfocado desaparecen: el foco pasa al botón «Cerrar» (D14).
  useEffect(() => {
    if (phase !== 'form') closeRef.current?.focus();
  }, [phase]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending) return;
    if (reason === '') {
      setReasonError(true);
      selectRef.current?.focus();
      return;
    }
    setSystemError(null);
    setMessageError(false);
    report.mutate(
      { challengeNumber: number, reason, message },
      {
        onSuccess: () => setPhase('success'),
        onError: (error) => {
          const code = error instanceof ApiError ? error.code : null;
          if (code === 'already_reported') setPhase('already');
          else if (code === 'invalid_report') setMessageError(true);
          else if (code === 'rate_limited') setSystemError('rateLimited');
          else setSystemError('error');
        },
      },
    );
  };

  const close = () => {
    if (!pending) onClose(phase !== 'form');
  };
  const onReason = (event: ChangeEvent<HTMLSelectElement>) => {
    setReason(event.target.value as ReportReason | '');
    setReasonError(false);
  };

  const used = message.length;
  const half = 'grow basis-50';

  return (
    <Dialog
      variant="modal"
      title={t('gameHost.report.title')}
      closeLabel={t('gameHost.report.close')}
      onClose={close}
      closeDisabled={pending}
      initialFocusRef={selectRef}
    >
      <p className="font-mono text-label-comment text-text-dim">
        {t('gameHost.report.challenge', { game: t(`games.${gameId}.name`), number })}
      </p>
      {from === 'game' ? (
        <Banner variant="warning" announce={false}>
          {t('gameHost.report.spoiler')}
        </Banner>
      ) : null}
      <form className="flex flex-col gap-5" onSubmit={submit} noValidate>
        {phase === 'form' ? (
          <>
            <SelectField
              label={t('gameHost.report.reasonLabel')}
              required
              value={reason}
              onChange={onReason}
              selectRef={selectRef}
              error={reasonError ? t('gameHost.report.reasonRequired') : undefined}
            >
              <option value="">{t('gameHost.report.reasonPlaceholder')}</option>
              {REPORT_REASONS.map((r) => (
                <option key={r} value={r}>
                  {t(`gameHost.report.reasons.${r}`)}
                </option>
              ))}
            </SelectField>
            <TextAreaField
              label={t('gameHost.report.messageLabel')}
              placeholder={t('gameHost.report.messagePlaceholder')}
              maxLength={MAX_MESSAGE}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              error={messageError ? t('gameHost.report.messageTooLong') : undefined}
              hint={
                <span aria-live={used > ANNOUNCE_FROM ? 'polite' : 'off'}>
                  {t('gameHost.report.counter', { used, max: MAX_MESSAGE })}
                </span>
              }
            />
            {systemError ? (
              <Alert>
                {systemError === 'rateLimited'
                  ? t('gameHost.report.rateLimited')
                  : t('gameHost.report.error')}
              </Alert>
            ) : null}
          </>
        ) : (
          <Banner
            variant="success"
            title={
              phase === 'success' ? t('gameHost.report.successTitle') : t('gameHost.report.already')
            }
          >
            {phase === 'success' ? t('gameHost.report.successDetail') : null}
          </Banner>
        )}
        <div className="flex flex-row-reverse flex-wrap gap-3">
          {phase === 'form' ? (
            <>
              <button
                type="submit"
                className={cn(buttonClass({ variant: 'primary', disabled: pending }), half)}
                aria-disabled={pending || undefined}
              >
                {pending ? (
                  t('gameHost.report.sending')
                ) : (
                  <>
                    <span aria-hidden="true">✓</span> {t('gameHost.report.submit')}
                  </>
                )}
              </button>
              <button
                type="button"
                className={cn(linkClass({ tone: 'subtle' }), 'justify-center', half)}
                onClick={close}
              >
                {t('gameHost.report.cancel')}
              </button>
            </>
          ) : (
            <button
              type="button"
              ref={closeRef}
              className={cn(buttonClass({ variant: 'secondary' }), half)}
              onClick={close}
            >
              {t('gameHost.report.close')}
            </button>
          )}
        </div>
      </form>
      <p className="font-sans text-caption text-text-muted">{t('gameHost.report.footer')}</p>
    </Dialog>
  );
}
