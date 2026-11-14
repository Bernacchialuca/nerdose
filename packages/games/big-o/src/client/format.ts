import type { Locale } from '@nerdose/core';

export const formatCount = (value: number, locale: Locale): string =>
  new Intl.NumberFormat(locale).format(value);
