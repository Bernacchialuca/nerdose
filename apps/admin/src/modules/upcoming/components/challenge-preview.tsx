import { Suspense } from 'react';

import type { GameId } from '@nerdose/core';
import { Panel } from '@nerdose/ui';

import { PayloadBilingual } from '@/modules/reports';

import { hasPreview, previewComponent } from '../registry';

import { PreviewErrorBoundary } from './preview-error-boundary';

type ChallengePreviewProps = { gameId: GameId; payload: Record<string, unknown> };

export function ChallengePreview({ gameId, payload }: ChallengePreviewProps) {
  if (!hasPreview(gameId)) return <PayloadBilingual payload={payload} />;
  const LazyPreview = previewComponent(gameId);
  return (
    <PreviewErrorBoundary payload={payload}>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {(['es', 'en'] as const).map((language) => (
          <Panel key={language} title={language.toUpperCase()} titleLevel={3}>
            <Suspense fallback={<p role="status">Cargando preview…</p>}>
              <LazyPreview payload={payload} language={language} />
            </Suspense>
          </Panel>
        ))}
      </div>
    </PreviewErrorBoundary>
  );
}
