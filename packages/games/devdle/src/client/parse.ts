import {
  publicViewSchema,
  resultSchema,
  stateSchema,
  statsSchema,
  type DevdlePublicView,
  type DevdleResult,
  type DevdleState,
  type DevdleStats,
} from '../definition/schemas';

export const parsePublicView = (v: unknown): DevdlePublicView => publicViewSchema.parse(v);
export const parseState = (v: unknown): DevdleState => stateSchema.parse(v);
export const parseResult = (v: unknown): DevdleResult => resultSchema.parse(v);
export const parseStats = (v: unknown): DevdleStats => statsSchema.parse(v);
