import { useEffect, useRef } from 'react';

import type { GameId } from '@nerdose/core';

const PIECES = 120;
const DURATION_MS = 2600;

/**
 * Festejo al ganar: confeti del color del juego (`--color-game-{id}` y su variante `-light`).
 * Decorativo (`aria-hidden`, sin eventos de puntero) y de una sola pasada: se monta solo en la
 * transición partida → resultado ganado, así que recargar el resultado no lo repite. Con
 * `prefers-reduced-motion` no anima. Sin Web Animations API (jsdom) no dibuja nada.
 */
export function Confetti({ gameId }: { gameId: GameId }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || typeof root.animate !== 'function') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

    const colors = [`var(--color-game-${gameId})`, `var(--color-game-${gameId}-light)`];
    const { innerWidth: width, innerHeight: height } = window;
    const animations: Animation[] = [];

    for (let i = 0; i < PIECES; i++) {
      const piece = document.createElement('span');
      const size = 6 + Math.random() * 6;
      Object.assign(piece.style, {
        position: 'absolute',
        top: '0',
        left: `${Math.random() * width}px`,
        width: `${size}px`,
        height: `${size * (0.4 + Math.random() * 0.6)}px`,
        background: colors[i % colors.length],
        borderRadius: i % 3 === 0 ? '50%' : '1px',
      });
      root.appendChild(piece);
      const drift = (Math.random() - 0.5) * 240;
      const spin = (Math.random() - 0.5) * 1440;
      animations.push(
        piece.animate(
          [
            { transform: 'translate3d(0, -20px, 0) rotate(0deg)', opacity: 1 },
            { opacity: 1, offset: 0.75 },
            {
              transform: `translate3d(${drift}px, ${height + 40}px, 0) rotate(${spin}deg)`,
              opacity: 0,
            },
          ],
          {
            duration: DURATION_MS * (0.7 + Math.random() * 0.5),
            delay: Math.random() * 400,
            easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)',
            fill: 'forwards',
          },
        ),
      );
    }

    return () => {
      for (const a of animations) a.cancel();
      root.replaceChildren();
    };
  }, [gameId]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-testid="confetti"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    />
  );
}
