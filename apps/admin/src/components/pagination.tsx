import { useState } from 'react';

import { buttonClass, cn } from '@nerdose/ui';

import { formatCount } from '@/lib/format-number';

export type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  /** Qué se cuenta, en plural ("términos", "días"): «1–25 de 4.863 términos». */
  noun: string;
  onChange: (page: number) => void;
  /** Etiqueta accesible del `nav`. */
  label?: string;
};

/** «‹ Anterior · 1–25 de 4.863 · Siguiente ›». No se dibuja si todo entra en una página. */
export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  noun,
  onChange,
  label = 'Paginado',
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;
  const nav = (disabled: boolean) =>
    cn(buttonClass({ variant: 'secondary', disabled }), 'min-w-28');
  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3">
      <button
        type="button"
        aria-disabled={atStart || undefined}
        onClick={() => {
          if (!atStart) onChange(page - 1);
        }}
        className={nav(atStart)}
      >
        <span aria-hidden="true">‹</span> Anterior
      </button>
      <p aria-live="polite" className="font-mono text-meta text-text-muted">
        {formatCount(from)}–{formatCount(to)} de {formatCount(total)} {noun} · página{' '}
        {formatCount(page)} de {formatCount(totalPages)}
      </p>
      <button
        type="button"
        aria-disabled={atEnd || undefined}
        onClick={() => {
          if (!atEnd) onChange(page + 1);
        }}
        className={nav(atEnd)}
      >
        Siguiente <span aria-hidden="true">›</span>
      </button>
    </nav>
  );
}

/** Paginado en el cliente para listas que ya llegaron enteras. Vuelve a la página 1 si achica. */
export function usePagination<T>(items: readonly T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const current = Math.min(page, totalPages);
  return {
    page: current,
    totalPages,
    total: items.length,
    pageSize,
    pageItems: items.slice((current - 1) * pageSize, current * pageSize),
    setPage,
  };
}
