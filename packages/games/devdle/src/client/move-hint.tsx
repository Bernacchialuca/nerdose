import { cn } from '@nerdose/ui';

/** `aviso-jugada`: always mounted so the live region exists before the message. */
export function MoveHint({ text, className }: { text: string; className?: string }) {
  return (
    <p
      role="status"
      className={cn(
        'min-h-5 text-center font-mono text-label-comment text-status-present',
        className,
      )}
    >
      {text}
    </p>
  );
}
