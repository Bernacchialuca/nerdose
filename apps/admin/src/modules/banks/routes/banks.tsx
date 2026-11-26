import { useEffect, useId, useState } from 'react';
import { useSearchParams } from 'react-router';

import type { BankName } from '@nerdose/core';
import { Alert, Panel, buttonClass, cn } from '@nerdose/ui';

import { Pagination } from '@/components/pagination';
import { Tabs } from '@/components/tabs';
import { usePageTitle } from '@/hooks/use-page-title';

import type { BankItemsQuery, BankItemStatus } from '../api/types';
import { BANK_PAGE_SIZE, useBankItems } from '../api/use-bank-items';
import { BankItemsTable } from '../components/bank-items-table';
import {
  BANK_TABS,
  STATUS_OPTIONS,
  bankQueryParams,
  categoryOptions,
  parseBankQuery,
} from '../labels';

const CONTROL =
  'w-full rounded-control border border-border-interactive bg-control px-3.5 py-3 font-mono text-mono-body text-text placeholder:text-text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent';
const LABEL = 'font-mono text-label-comment text-text-body';
const SEARCH_DEBOUNCE_MS = 300;

export function Component() {
  const headingRef = usePageTitle('Bancos · Admin · nerdose');
  const [params, setParams] = useSearchParams();
  const query = parseBankQuery(params);
  const items = useBankItems(query);
  const ids = { q: useId(), status: useId(), category: useId() };

  const update = (patch: Partial<BankItemsQuery>) => {
    // Cualquier filtro nuevo vuelve a la primera página.
    setParams(bankQueryParams({ ...query, page: 1, ...patch }), { replace: true });
  };

  // El buscador escribe en la URL con un respiro, para no pedir una página por tecla.
  const [search, setSearch] = useState(query.q);
  useEffect(() => {
    if (search.trim() === query.q) return;
    const timer = setTimeout(() => {
      update({ q: search.trim() });
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
    };
    // `update` cambia en cada render; el efecto solo depende del texto y de la query actual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, query.q]);

  const data = items.data;
  let content;
  if (data) {
    content =
      data.items.length === 0 ? (
        <p className="font-sans text-body text-text-muted">Ningún ítem coincide con los filtros.</p>
      ) : (
        <>
          <BankItemsTable bank={query.bank} items={data.items} />
          <Pagination
            page={data.page}
            totalPages={data.total_pages}
            total={data.total}
            pageSize={BANK_PAGE_SIZE}
            noun={query.bank === 'terms' ? 'términos' : 'hechos'}
            onChange={(page) => {
              setParams(bankQueryParams({ ...query, page }));
            }}
            label="Paginado del banco"
          />
        </>
      );
  } else if (items.isError) {
    content = (
      <Alert
        title="No pudimos cargar el banco. Probá de nuevo."
        action={
          <button
            type="button"
            onClick={() => {
              void items.refetch();
            }}
            className={buttonClass({ variant: 'secondary' })}
          >
            Reintentar
          </button>
        }
      />
    );
  } else {
    content = <p role="status">Cargando…</p>;
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h1 ref={headingRef} tabIndex={-1} className="font-mono text-title-page text-text">
          Bancos de contenido
        </h1>
        <p className="font-sans text-body-sm text-text-muted">
          Los términos alimentan Devdle y Grep Grid; los hechos, Tech Timeline. Se cargan del
          dataset versionado: acá solo se consultan.
        </p>
      </div>
      <Tabs
        label="Banco"
        tabs={BANK_TABS}
        value={query.bank}
        onChange={(bank: BankName) => {
          setSearch('');
          setParams(bankQueryParams({ bank, q: '', status: null, category: null, page: 1 }));
        }}
      >
        <Panel>
          <form
            role="search"
            aria-label="Filtros del banco"
            onSubmit={(e) => {
              e.preventDefault();
              update({ q: search.trim() });
            }}
            className="grid grid-cols-1 gap-3 md:grid-cols-4"
          >
            <div className="flex flex-col gap-1.5 md:col-span-2">
              <label htmlFor={ids.q} className={LABEL}>
                Buscar
              </label>
              <input
                id={ids.q}
                type="search"
                value={search}
                maxLength={50}
                placeholder={query.bank === 'terms' ? 'p. ej. kernel' : 'p. ej. linux'}
                onChange={(e) => {
                  setSearch(e.target.value);
                }}
                className={CONTROL}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.status} className={LABEL}>
                Estado
              </label>
              <select
                id={ids.status}
                value={query.status ?? ''}
                onChange={(e) => {
                  update({ status: (e.target.value || null) as BankItemStatus | null });
                }}
                className={cn(CONTROL, 'ds-select')}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor={ids.category} className={LABEL}>
                Categoría
              </label>
              <select
                id={ids.category}
                value={query.category ?? ''}
                onChange={(e) => {
                  update({ category: e.target.value || null });
                }}
                className={cn(CONTROL, 'ds-select')}
              >
                <option value="">Todas</option>
                {categoryOptions(query.bank).map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </form>
        </Panel>
        <div className="mt-4 flex flex-col gap-3" aria-busy={items.isFetching || undefined}>
          {content}
        </div>
      </Tabs>
    </>
  );
}
