import { TERM_CATEGORIES, TIMELINE_CATEGORIES, type BankName } from '@nerdose/core';

import type { BankItemsQuery, BankItemStatus } from './api/types';

export const BANK_TABS: readonly { value: BankName; label: string }[] = [
  { value: 'terms', label: 'Términos' },
  { value: 'timeline_facts', label: 'Hechos (Timeline)' },
];

const TERM_CATEGORY_LABELS: Record<(typeof TERM_CATEGORIES)[number], string> = {
  programming_languages: 'Lenguajes',
  git: 'Git y wikis',
  databases: 'Bases de datos',
  networking: 'Redes',
  linux: 'Linux y SO',
  apis: 'APIs',
  security: 'Seguridad',
  software_engineering: 'Ingeniería de software',
};

const TIMELINE_CATEGORY_LABELS: Record<(typeof TIMELINE_CATEGORIES)[number], string> = {
  programming_languages: 'Lenguajes',
  frameworks: 'Frameworks',
  companies: 'Empresas',
  operating_systems: 'Sistemas operativos',
  hardware: 'Hardware',
  video_games: 'Videojuegos',
  databases: 'Bases de datos',
  software_tools: 'Herramientas',
};

export function categoryOptions(bank: BankName): { value: string; label: string }[] {
  return bank === 'terms'
    ? TERM_CATEGORIES.map((c) => ({ value: c, label: TERM_CATEGORY_LABELS[c] }))
    : TIMELINE_CATEGORIES.map((c) => ({ value: c, label: TIMELINE_CATEGORY_LABELS[c] }));
}

export function categoryLabel(bank: BankName, category: string): string {
  return categoryOptions(bank).find((o) => o.value === category)?.label ?? category;
}

/** Motivos que pone el import de bancos (y el `duplicate` del sync); el resto se muestra tal cual. */
const REASON_LABELS: Record<string, string> = {
  invalid_chars: 'caracteres fuera de A–Z',
  invalid_length: 'largo fuera de 4–12',
  missing_translation: 'falta la traducción',
  missing_article: 'sin artículo en Wikipedia',
  low_sitelinks: 'poco conocido (sitelinks)',
  excluded: 'excluido a mano',
  duplicate: 'duplicado',
  disputed_date: 'fecha discutida',
  imprecise_date: 'fecha imprecisa',
  missing_note: 'sin nota',
  note_year_mismatch: 'la nota no coincide con el año',
};

export const reasonLabel = (reason: string): string => REASON_LABELS[reason] ?? reason;

export const STATUS_OPTIONS: { value: BankItemStatus | ''; label: string }[] = [
  { value: '', label: 'Todos' },
  { value: 'approved', label: 'Aprobados' },
  { value: 'rejected', label: 'Rechazados' },
];

/** Filtros desde la URL: lo inválido cae al valor por defecto en lugar de romper la pantalla. */
export function parseBankQuery(params: URLSearchParams): BankItemsQuery {
  const bank: BankName = params.get('bank') === 'timeline_facts' ? 'timeline_facts' : 'terms';
  const statusParam = params.get('status');
  const status: BankItemStatus | null =
    statusParam === 'approved' || statusParam === 'rejected' ? statusParam : null;
  const categoryParam = params.get('category');
  const category =
    categoryParam && categoryOptions(bank).some((o) => o.value === categoryParam)
      ? categoryParam
      : null;
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  return { bank, q: (params.get('q') ?? '').trim().slice(0, 50), status, category, page };
}

export function bankQueryParams(q: BankItemsQuery): Record<string, string> {
  const out: Record<string, string> = { bank: q.bank };
  if (q.q) out.q = q.q;
  if (q.status) out.status = q.status;
  if (q.category) out.category = q.category;
  if (q.page > 1) out.page = String(q.page);
  return out;
}
