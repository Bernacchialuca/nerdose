/** `aviso-jugada`: always mounted so the live region exists before the message. */
export function MoveHint({ text }: { text: string }) {
  return (
    <p role="status" className="min-h-5 text-center font-mono text-label-comment text-status-present">
      {text}
    </p>
  );
}
