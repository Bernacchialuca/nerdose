import {
  payloadSchema,
  publicViewSchema,
  resultSchema,
  stateSchema,
  type BigOPayload,
  type BigOPublicView,
  type BigOResult,
  type BigOState,
} from '../definition/schemas';

export const parsePublicView = (v: unknown): BigOPublicView => publicViewSchema.parse(v);
export const parseState = (v: unknown): BigOState => stateSchema.parse(v);
export const parseResult = (v: unknown): BigOResult => resultSchema.parse(v);
export const parsePayload = (v: unknown): BigOPayload => payloadSchema.parse(v);
