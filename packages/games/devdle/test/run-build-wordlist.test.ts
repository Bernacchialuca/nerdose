import { existsSync, readFileSync } from 'node:fs';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpRequestError } from '../scripts/build-wordlist/http';
import { EmptySourceError, runBuildWordlist } from '../scripts/build-wordlist/run';
import { buildWordList, serializeWordList } from '../scripts/build-wordlist/words';

const fixture = (name: string): string =>
  fileURLToPath(new URL(`./fixtures/${name}`, import.meta.url));
const enablePath = fixture('enable-sample.txt');
const sparql = (qid: string): string =>
  readFileSync(fixture(`sparql-${qid.toLowerCase()}.json`), 'utf8');
const empty = JSON.stringify({ results: { bindings: [] } });
const noopSleep = async (): Promise<void> => {};
const now = new Date('2026-11-07T10:00:00.000Z');

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), 'devdle-wordlist-'));
});

describe('runBuildWordlist', () => {
  it('runs end to end with fixtures (TS-55)', async () => {
    const calls: { url: string; headers: Record<string, string> }[] = [];
    const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      const u = String(url);
      calls.push({ url: u, headers: init?.headers as Record<string, string> });
      const qid = decodeURIComponent(u).match(/wd:(Q\d+)/)?.[1] as string;
      return new Response(sparql(qid), { status: 200 });
    });
    const outPath = join(dir, 'words.txt');
    const counts = await runBuildWordlist({
      enable: enablePath,
      outPath,
      classes: ['Q9143', 'Q176165'],
      contact: 'dev@example.com',
      now,
      fetch: fakeFetch as unknown as typeof fetch,
      sleep: noopSleep,
    });

    const labels = ['JavaScript', 'Rust', 'C++', 'Go', 'PostgreSQL', 'Redis', 'Node.js'];
    const enableText = await readFile(enablePath, 'utf8');
    expect(await readFile(outPath, 'utf8')).toBe(
      serializeWordList(buildWordList(enableText, labels)),
    );
    expect(calls).toHaveLength(2);
    for (const c of calls) {
      expect(c.url).toMatch(/^https:\/\/query\.wikidata\.org\/sparql\?query=.*&format=json$/);
      expect(c.headers['User-Agent']).toBe('nerdose-content/2026.11.07 (dev@example.com)');
      expect(c.headers.Accept).toBe('application/sparql-results+json');
    }
    expect(counts.enable).toBe(7);
    expect(counts.wikidata).toBe(4);
    expect(counts.onlyWikidata).toBe(counts.total - counts.enable);
    expect(existsSync(`${outPath}.tmp`)).toBe(false);
  });

  it('merges the extras file when given', async () => {
    const extrasPath = join(dir, 'extra.txt');
    await writeFile(extrasPath, '# curados\nLinux\nkubernetes\n');
    const outPath = join(dir, 'words.txt');
    await runBuildWordlist({
      enable: enablePath,
      outPath,
      extrasPath,
      classes: ['Q9143'],
      contact: 'c',
      now,
      fetch: (async () =>
        new Response(sparql('Q9143'), { status: 200 })) as unknown as typeof fetch,
      sleep: noopSleep,
    });
    const words = (await readFile(outPath, 'utf8')).split('\n');
    expect(words).toContain('LINUX');
    expect(words).toContain('KUBERNETES');
  });

  it('downloads ENABLE by URL (TS-56)', async () => {
    const urls: string[] = [];
    const headers: Record<string, string>[] = [];
    const fakeFetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
      urls.push(String(url));
      headers.push(init?.headers as Record<string, string>);
      return new Response(String(url).includes('sparql') ? sparql('Q9143') : 'zebra\nllama\n', {
        status: 200,
      });
    });
    const outPath = join(dir, 'words.txt');
    await runBuildWordlist({
      enable: 'https://example.org/enable1.txt',
      outPath,
      classes: ['Q9143'],
      contact: 'dev@example.com',
      now,
      fetch: fakeFetch as unknown as typeof fetch,
      sleep: noopSleep,
    });
    expect(urls[0]).toBe('https://example.org/enable1.txt');
    expect(headers[0]?.['User-Agent']).toBe('nerdose-content/2026.11.07 (dev@example.com)');
    const text = await readFile(outPath, 'utf8');
    expect(text).toContain('ZEBRA');
    expect(text).toContain('LLAMA');
  });

  it('fails without writing when SPARQL keeps failing (TS-57)', async () => {
    const outPath = join(dir, 'words.txt');
    await writeFile(outPath, 'OLD\n');
    const sleeps: number[] = [];
    const fakeFetch = vi.fn(async () => new Response('', { status: 503 }));
    await expect(
      runBuildWordlist({
        enable: enablePath,
        outPath,
        classes: ['Q9143'],
        contact: 'c',
        now,
        fetch: fakeFetch as unknown as typeof fetch,
        sleep: async (ms) => void sleeps.push(ms),
      }),
    ).rejects.toBeInstanceOf(HttpRequestError);
    expect(fakeFetch).toHaveBeenCalledTimes(6);
    expect(sleeps).toEqual(expect.arrayContaining([1000, 2000, 4000, 8000, 16000]));
    expect(await readFile(outPath, 'utf8')).toBe('OLD\n');
  });

  it('rejects empty sources without writing (TS-59)', async () => {
    const outPath = join(dir, 'words.txt');
    const badEnable = join(dir, 'bad-enable.txt');
    await writeFile(badEnable, 'abc\nco-op\n');
    const okFetch = (async () =>
      new Response(sparql('Q9143'), { status: 200 })) as unknown as typeof fetch;
    const emptyFetch = (async () =>
      new Response(empty, { status: 200 })) as unknown as typeof fetch;

    await expect(
      runBuildWordlist({
        enable: badEnable,
        outPath,
        classes: ['Q9143'],
        contact: 'c',
        now,
        fetch: okFetch,
        sleep: noopSleep,
      }),
    ).rejects.toThrow(/ENABLE/);
    await expect(
      runBuildWordlist({
        enable: enablePath,
        outPath,
        classes: ['Q9143'],
        contact: 'c',
        now,
        fetch: emptyFetch,
        sleep: noopSleep,
      }),
    ).rejects.toBeInstanceOf(EmptySourceError);
    expect(existsSync(outPath)).toBe(false);
  });
});
