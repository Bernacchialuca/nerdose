import { useEffect, useRef } from 'react';

import type { GameId } from '@nerdose/core';

/** Piezas por fuente: lluvia desde arriba y un cañón en cada costado. */
const RAIN = 60;
const CANNON = 45;
const DURATION_MS = 2600;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

type Piece = {
  x: number;
  y: number;
  keyframes: Keyframe[];
  duration: number;
  delay: number;
};

/** Cae desde arriba con deriva lateral y giro. */
function rainPiece(width: number, height: number): Piece {
  const drift = rand(-120, 120);
  const spin = rand(-720, 720);
  return {
    x: rand(0, width),
    y: -20,
    keyframes: [
      {
        transform: 'translate3d(0, 0, 0) rotate(0deg)',
        opacity: 1,
        easing: 'cubic-bezier(0.2, 0.6, 0.4, 1)',
      },
      { opacity: 1, offset: 0.75 },
      { transform: `translate3d(${drift}px, ${height + 60}px, 0) rotate(${spin}deg)`, opacity: 0 },
    ],
    duration: DURATION_MS * rand(0.8, 1.2),
    delay: rand(0, 500),
  };
}

/**
 * Sale disparada desde un costado hacia el centro y arriba (frena al subir), y después cae
 * acelerando: una parábola aproximada con dos tramos de easing.
 */
function cannonPiece(side: 'left' | 'right', width: number, height: number): Piece {
  const dir = side === 'left' ? 1 : -1;
  const startY = height * rand(0.55, 0.8);
  const reach = width * rand(0.15, 0.45);
  const peakY = height * rand(0.05, 0.4) - startY;
  const spin = rand(-900, 900);
  return {
    x: side === 'left' ? -10 : width + 10,
    y: startY,
    keyframes: [
      {
        transform: 'translate3d(0, 0, 0) rotate(0deg)',
        opacity: 1,
        easing: 'cubic-bezier(0.1, 0.7, 0.3, 1)',
      },
      {
        transform: `translate3d(${dir * reach * 0.7}px, ${peakY}px, 0) rotate(${spin * 0.4}deg)`,
        opacity: 1,
        offset: 0.35,
        easing: 'cubic-bezier(0.5, 0, 0.9, 0.6)',
      },
      {
        transform: `translate3d(${dir * reach}px, ${height - startY + 60}px, 0) rotate(${spin}deg)`,
        opacity: 0,
      },
    ],
    duration: DURATION_MS * rand(0.9, 1.25),
    delay: rand(0, 250),
  };
}

/**
 * Festejo al ganar: confeti del color del juego (`--color-game-{id}` y su variante `-light`) que
 * llueve desde arriba y sale disparado de los dos costados. Capa fija sobre la pantalla: no mueve
 * el scroll. Decorativo (`aria-hidden`, sin eventos de puntero) y de una sola pasada: se monta solo
 * en la transición partida → resultado ganado, así que recargar el resultado no lo repite. Con
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
    const pieces: Piece[] = [
      ...Array.from({ length: RAIN }, () => rainPiece(width, height)),
      ...Array.from({ length: CANNON }, () => cannonPiece('left', width, height)),
      ...Array.from({ length: CANNON }, () => cannonPiece('right', width, height)),
    ];
    const animations: Animation[] = [];

    pieces.forEach((p, i) => {
      const el = document.createElement('span');
      const size = rand(6, 12);
      Object.assign(el.style, {
        position: 'absolute',
        left: `${p.x}px`,
        top: `${p.y}px`,
        width: `${size}px`,
        height: `${size * rand(0.4, 1)}px`,
        background: colors[i % colors.length],
        borderRadius: i % 3 === 0 ? '50%' : '1px',
      });
      root.appendChild(el);
      animations.push(
        el.animate(p.keyframes, {
          duration: p.duration,
          delay: p.delay,
          fill: 'forwards',
          easing: 'linear',
        }),
      );
    });

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
