import type { WikimediaClient } from './http';

export type WikiLang = 'es' | 'en';

export function summaryUrl(lang: WikiLang, title: string): string {
  return `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replaceAll(' ', '_'))}`;
}

export function parseSummary(body: unknown): string | null {
  if (typeof body !== 'object' || body === null) return null;
  const { type, extract } = body as { type?: unknown; extract?: unknown };
  if (type === 'disambiguation') return null;
  if (typeof extract !== 'string' || extract.trim() === '') return null;
  return extract;
}

export async function fetchSummary(
  client: WikimediaClient,
  lang: WikiLang,
  title: string,
): Promise<string | null> {
  const { status, body } = await client.getJson(summaryUrl(lang, title), { cacheable404: true });
  return status === 404 ? null : parseSummary(body);
}
