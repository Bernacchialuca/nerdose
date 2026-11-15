import { Alert, buttonClass } from '@nerdose/ui';

export function RangeAlert({ id, message }: { id: string; message: string }) {
  return (
    <div id={id}>
      <Alert>{message}</Alert>
    </div>
  );
}

export function SystemAlert({ onRetry }: { onRetry: () => void }) {
  return (
    <Alert
      title="No pudimos cargar las métricas. Probá de nuevo."
      action={
        <button type="button" onClick={onRetry} className={buttonClass({ variant: 'secondary' })}>
          Reintentar
        </button>
      }
    />
  );
}

export function LoadingNotice() {
  return <p role="status">Consultando métricas…</p>;
}
