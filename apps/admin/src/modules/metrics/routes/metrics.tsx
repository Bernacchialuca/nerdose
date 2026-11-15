import { useSearchParams } from 'react-router';

import { usePageTitle } from '@/hooks/use-page-title';

import { MetricsView } from '../components/metrics-view';
import { readRange } from '../range';

export function Component() {
  const headingRef = usePageTitle('Métricas · Admin · nerdose');
  const [params, setParams] = useSearchParams();
  const urlRange = readRange(params, new Date());
  return (
    <>
      <h1 ref={headingRef} tabIndex={-1} className="font-mono text-title-page text-text">
        Métricas
      </h1>
      <MetricsView
        key={`${urlRange.from}|${urlRange.to}`}
        urlRange={urlRange}
        onSubmit={(range) => {
          setParams(range);
        }}
      />
    </>
  );
}
