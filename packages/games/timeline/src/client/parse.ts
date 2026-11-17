import {
  feedbackSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  statsSchema,
  type TimelineFeedback,
  type TimelinePublicView,
  type TimelineResult,
  type TimelineState,
  type TimelineStats,
} from '../definition/schemas';

export const parsePublicView = (v: unknown): TimelinePublicView => publicViewSchema.parse(v);
export const parseState = (v: unknown): TimelineState => stateSchema.parse(v);
export const parseFeedback = (v: unknown): TimelineFeedback => feedbackSchema.parse(v);
export const parseResult = (v: unknown): TimelineResult => resultSchema.parse(v);
export const parseStats = (v: unknown): TimelineStats => statsSchema.parse(v);
