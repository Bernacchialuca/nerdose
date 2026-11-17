import {
  payloadSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  statsSchema,
  type BugHuntPayload,
  type BugHuntPublicView,
  type BugHuntResult,
  type BugHuntState,
  type BugHuntStats,
} from '../definition/schemas';

export const parsePublicView = (v: unknown): BugHuntPublicView => publicViewSchema.parse(v);
export const parseState = (v: unknown): BugHuntState => stateSchema.parse(v);
export const parseResult = (v: unknown): BugHuntResult => resultSchema.parse(v);
export const parsePayload = (v: unknown): BugHuntPayload => payloadSchema.parse(v);
export const parseStats = (v: unknown): BugHuntStats => statsSchema.parse(v);
