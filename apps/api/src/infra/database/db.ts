import { createDb } from '@nerdose/db';

export type Sql = ReturnType<typeof createDb>['sql'];

export function createDatabase(url: string) {
  return createDb(url);
}
