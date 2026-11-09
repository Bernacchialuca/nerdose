/**
 * Mueve el foco al `h1` de `main`. Los `h1` de los clients no tienen `tabindex`, así que se lo
 * ponemos: sin eso `focus()` no hace nada. El título no es interactivo (`tabindex="-1"` no lo suma
 * al orden de tabulación), así que no lleva anillo de foco: `outline-none`.
 */
export function focusMainHeading(): void {
  const heading = document.querySelector<HTMLElement>('main h1');
  if (!heading) return;
  if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
  heading.classList.add('outline-none');
  heading.focus();
}
