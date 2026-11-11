import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

import { focusMainHeading } from '@/lib/focus-main-heading';

/**
 * Mueve el foco al `h1` cuando la pantalla de juego cambia de fase (partida a resultado, etc.), para
 * que el lector de pantalla lo anuncie. Se monta con `key={fase}` dentro de cada fase. La primera
 * fase de una carga directa (`firstPhaseRef`) no roba el foco: el jugador acaba de llegar. El foco
 * se mueve sin scroll: al cerrar la partida la pantalla no salta al inicio.
 */
export function PhaseFocus({ firstPhaseRef }: { firstPhaseRef: RefObject<boolean> }) {
  // Decide en el primer efecto (los refs no se leen en render) y conserva la decisión si StrictMode
  // lo corre dos veces.
  const skipRef = useRef<boolean | null>(null);

  useEffect(() => {
    skipRef.current ??= firstPhaseRef.current;
    firstPhaseRef.current = false;
    if (!skipRef.current) focusMainHeading({ preventScroll: true });
  }, [firstPhaseRef]);

  return null;
}
