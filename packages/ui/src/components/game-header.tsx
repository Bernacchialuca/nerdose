import type { ReactElement, ReactNode } from 'react';

import { cn } from '../cn';

import { FOCUS_RING } from './focus';
import { GAME_CLASSES, type UiGameId } from './game-classes';

export type GameHeaderProps = {
  game: UiGameId;
  navLabel: string;
  homeLabel: ReactNode;
  /** El consumidor arma el link a home (p. ej. `<Link>`) con las props recibidas. */
  renderHome: (props: { className: string; children: ReactNode }) => ReactElement;
  crumb: ReactNode;
  meta?: ReactNode;
  /** Acciones (ayuda, estadísticas, compartir, ...). */
  children?: ReactNode;
  className?: string;
};

export function GameHeader({
  game,
  navLabel,
  homeLabel,
  renderHome,
  crumb,
  meta,
  children,
  className,
}: GameHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 border-b border-border-subtle px-8 py-3.5',
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-4.5">
        <nav aria-label={navLabel}>
          <ol className="flex flex-wrap items-center gap-4.5">
            <li>
              {renderHome({
                className: cn(
                  'inline-flex min-h-11 items-center font-mono text-brand-logo-compact text-text',
                  FOCUS_RING,
                ),
                children: (
                  <>
                    <span aria-hidden="true" className="text-accent">
                      &gt;
                    </span>{' '}
                    {homeLabel}
                  </>
                ),
              })}
            </li>
            <li className="flex items-center gap-4.5">
              <span aria-hidden="true" className="font-sans text-text-separator">
                /
              </span>
              <span
                aria-current="page"
                className={cn('font-mono text-brand-crumb', GAME_CLASSES[game].text)}
              >
                {crumb}
              </span>
            </li>
          </ol>
        </nav>
        {meta != null ? <p className="font-mono text-label-comment text-text-dim">{meta}</p> : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}
