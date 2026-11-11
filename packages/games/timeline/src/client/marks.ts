import type { TimelineResult } from '../definition/schemas';

export type PositionMark = {
  opaque_id: string;
  label: string;
  /** 1-based position the player submitted. */
  position: number;
  correct: boolean;
  /** 1-based position it belongs to. */
  correctPosition: number;
};

/** One mark per submitted position, in the submitted order. */
export function positionMarks(result: TimelineResult): PositionMark[] {
  return result.submitted_order.map((opaque_id, i) => {
    const correctIndex = result.correct_order.indexOf(opaque_id);
    return {
      opaque_id,
      label: result.items.find((it) => it.opaque_id === opaque_id)?.label ?? opaque_id,
      position: i + 1,
      correct: result.correct_order[i] === opaque_id,
      correctPosition: correctIndex + 1,
    };
  });
}

/** 🟩/🟥 per submitted position (share text). */
export const squares = (result: TimelineResult): string =>
  positionMarks(result)
    .map((m) => (m.correct ? '🟩' : '🟥'))
    .join('');
