import { Alert, buttonClass } from '@nerdose/ui';

import { usePageTitle } from '@/hooks/use-page-title';

import { useContentStock } from '../api/use-content-stock';
import { StockContent } from '../components/stock-content';

export function Component() {
  const headingRef = usePageTitle('Stock · Admin · nerdose');
  const query = useContentStock();
  const data = query.data;

  let content;
  if (data) {
    content = <StockContent data={data} />;
  } else if (query.isError) {
    content = (
      <Alert
        title="No pudimos cargar el stock. Probá de nuevo."
        action={
          <button
            type="button"
            onClick={() => {
              void query.refetch();
            }}
            className={buttonClass({ variant: 'secondary' })}
          >
            Reintentar
          </button>
        }
      />
    );
  } else {
    content = <p role="status">Cargando stock…</p>;
  }

  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="font-mono text-title-page text-text">
        Stock de contenido
      </h1>
      {content}
    </>
  );
}
