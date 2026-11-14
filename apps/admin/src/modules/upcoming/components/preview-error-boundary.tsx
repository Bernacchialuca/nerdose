import { Component } from 'react';
import type { ReactNode } from 'react';

import { Banner } from '@nerdose/ui';

import { PayloadBilingual } from '@/modules/reports';

type Props = { payload: Record<string, unknown>; children: ReactNode };

/** Si una preview no se puede dibujar, el detalle sigue usable con la vista genérica. */
export class PreviewErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="flex flex-col gap-4">
        <Banner
          variant="warning"
          announce={false}
          title="No pudimos mostrar la preview del juego. Mostramos los datos del desafío."
        />
        <PayloadBilingual payload={this.props.payload} />
      </div>
    );
  }
}
