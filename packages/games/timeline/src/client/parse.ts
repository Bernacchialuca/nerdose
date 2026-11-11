import {
  feedbackSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  type TimelineFeedback,
  type TimelinePublicView,
  type TimelineResult,
  type TimelineState,
} from '../definition/schemas';

export const parsePublicView = (v: unknown): TimelinePublicView => publicViewSchema.parse(v);
export const parseState = (v: unknown): TimelineState => stateSchema.parse(v);
export const parseFeedback = (v: unknown): TimelineFeedback => feedbackSchema.parse(v);
export const parseResult = (v: unknown): TimelineResult => resultSchema.parse(v);
