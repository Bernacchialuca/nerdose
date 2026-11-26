import { Suspense, createElement } from 'react';

import type { GameId } from '@nerdose/core';
import { Panel } from '@nerdose/ui';

import { PayloadTexts } from '@/modules/reports';

import { hasPreview, previewComponent } from '../registry';

import { PreviewErrorBoundary } from './preview-error-boundary';

type ChallengePreviewProps = { gameId: GameId; payload: Record<string, unknown> };

export function ChallengePreview({ gameId, payload }: ChallengePreviewProps) {
  if (!hasPreview(gameId)) return <PayloadTexts payload={payload} />;
  return (
    <PreviewErrorBoundary payload={payload}>
      {/* El admin es solo en español: la versión en inglés del desafío no se previsualiza. */}
      <Panel title="Vista previa" titleLevel={3}>
        <Suspense fallback={<p role="status">Cargando preview…</p>}>
          {/* `previewComponent` cachea un lazy por juego: la referencia es estable entre renders. */}
          {createElement(previewComponent(gameId), { payload, language: 'es' })}
        </Suspense>
      </Panel>
    </PreviewErrorBoundary>
  );
}
