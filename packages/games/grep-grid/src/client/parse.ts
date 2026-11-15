import {
  feedbackSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  statsSchema,
  type GrepGridFeedback,
  type GrepGridPublicView,
  type GrepGridResult,
  type GrepGridState,
  type GrepGridStats,
} from '../definition/schemas';

export const parsePublicView = (v: unknown): GrepGridPublicView => publicViewSchema.parse(v);
export const parseState = (v: unknown): GrepGridState => stateSchema.parse(v);
export const parseFeedback = (v: unknown): GrepGridFeedback => feedbackSchema.parse(v);
export const parseResult = (v: unknown): GrepGridResult => resultSchema.parse(v);
export const parseStats = (v: unknown): GrepGridStats => statsSchema.parse(v);
