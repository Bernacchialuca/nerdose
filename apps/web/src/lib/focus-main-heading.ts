/**
 * Mueve el foco al `h1` de `main`. Los `h1` de los clients no tienen `tabindex`, así que se lo
 * ponemos: sin eso `focus()` no hace nada.
 */
export function focusMainHeading(): void {
  const heading = document.querySelector<HTMLElement>('main h1');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.focus();
}
