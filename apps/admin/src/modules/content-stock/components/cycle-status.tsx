export function CycleStatus({ ok }: { ok: boolean }) {
  if (ok) return <span>Sí</span>;
  // El estado va en texto además de color.
  return (
    <span className="text-status-warning">
      <span aria-hidden="true">⚠ </span>No
    </span>
  );
}
