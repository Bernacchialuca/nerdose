import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PublishingRepository } from '@/domain/publishing/publishing.repository';
import { WordList, resolveWordlistPath } from '@/infra/cache/word-list';

import { useDatabases } from '../helpers/db';

const dbs = useDatabases();
beforeAll(() => dbs.reset());
afterAll(() => dbs.close());

const file = (content: string) => {
  const path = join(mkdtempSync(join(tmpdir(), 'wl-')), 'words.txt');
  writeFileSync(path, content);
  return path;
};

describe('WordList', () => {
  it('TS-9 une el archivo base con los términos approved', async () => {
    await dbs.insertTerm({ term: 'KUBECTL', status: 'approved' });
    await dbs.insertTerm({ term: 'DOCKERX', status: 'rejected', rejectionReason: 'x' });
    const list = await WordList.load(file('CACHE\nREACT\n\n'));
    await list.reload(new PublishingRepository(dbs.api.db));
    expect(list.has('REACT')).toBe(true);
    expect(list.has('react')).toBe(true);
    expect(list.has('KUBECTL')).toBe(true);
    expect(list.has('DOCKERX')).toBe(false);
    expect(list.has('ZZZZZ')).toBe(false);
  });

  it('TS-10 antes de recargar y con recarga fallida conserva el set', async () => {
    const list = await WordList.load(file('CACHE\nREACT\n'));
    expect(list.has('CACHE')).toBe(true);
    expect(list.has('KUBECTL')).toBe(false);
    await expect(
      list.reload({
        findApprovedTerms: async () => {
          throw new Error('db down');
        },
      }),
    ).rejects.toThrow('db down');
    expect(list.has('CACHE')).toBe(true);
  });

  it('TS-11 carga el words.txt real', async () => {
    const list = await WordList.load(resolveWordlistPath());
    expect(list.has('MERGE')).toBe(true);
    expect(list.has('REACT')).toBe(true);
  });

  it('TS-12 archivo inexistente rechaza', async () => {
    await expect(WordList.load('/tmp/no-existe/words.txt')).rejects.toThrow(/ENOENT/);
  });

  it('tolera CRLF', async () => {
    const list = await WordList.load(file('CACHE\r\nREACT\r\n'));
    expect(list.has('CACHE')).toBe(true);
  });
});
