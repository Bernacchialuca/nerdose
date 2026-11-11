/**
 * Mueve el foco al `h1` de `main`. Los `h1` de los clients no tienen `tabindex`, así que se lo
 * ponemos: sin eso `focus()` no hace nada. El título no es interactivo (`tabindex="-1"` no lo suma
 * al orden de tabulación), así que no lleva anillo de foco: `outline-none`.
 *
 * `preventScroll`: enfoca sin mover la pantalla (cambio de fase dentro de un juego: el lector
 * anuncia el título y el jugador se queda donde estaba). Al navegar entre rutas se omite.
 */
export function focusMainHeading({
  preventScroll = false,
}: { preventScroll?: boolean } = {}): void {
  const heading = document.querySelector<HTMLElement>('main h1');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.classList.add('outline-none');
  heading.focus({ preventScroll });
}
