import { CODE_LANGUAGES, LOCALES } from '@nerdose/core';
import { pgEnum } from 'drizzle-orm/pg-core';

export const localeEnum = pgEnum('locale', LOCALES);
export const codeLanguageEnum = pgEnum('code_language', CODE_LANGUAGES);
