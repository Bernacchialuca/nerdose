export type VoidChoice =
  | { kind: 'term' | 'timeline_fact'; label: string }
  | { kind: 'template' | 'none' }
  | null;

const BASE =
  'deja de aceptar jugadas y todas sus partidas pasan a anuladas (las terminadas conservan su resultado); los jugadores conservan su racha. Los reportes abiertos se resuelven.';
const RECALC = 'Se recalculan las estadísticas de los jugadores afectados.';

export function voidSummary(
  challenge: string,
  choice: VoidChoice,
): { text: string; footnote?: string } {
  const head = `Esto no se puede deshacer. ${challenge} ${BASE}`;
  if (choice === null) return { text: `${head} ${RECALC}` };
  if (choice.kind === 'template' || choice.kind === 'none') {
    return { text: `${head} Ningún término ni hecho cambia de estado. ${RECALC}` };
  }
  if (!('label' in choice)) return { text: head };
  const name = choice.kind === 'term' ? `El término ${choice.label}` : `El hecho «${choice.label}»`;
  const used = choice.kind === 'term' ? choice.label : `«${choice.label}»`;
  return {
    text: `${head} ${name} queda rechazado y no vuelve a usarse. ${RECALC}`,
    footnote: `Los desafíos ya generados de los próximos días que usen ${used} no cambian.`,
  };
}
