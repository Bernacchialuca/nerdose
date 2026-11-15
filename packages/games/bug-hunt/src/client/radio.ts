/** Radiogroup keyboard navigation (APG): next index for `key`, or null when the key is not handled. */
export function moveRadio(index: number, key: string, count: number): number | null {
  switch (key) {
    case 'ArrowRight':
    case 'ArrowDown':
      return (index + 1) % count;
    case 'ArrowLeft':
    case 'ArrowUp':
      return (index - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/** Code-line navigation: only the keys that move focus between eligible lines; arrows left/right stay for scrolling. */
export function moveLine(index: number, key: string, count: number): number | null {
  switch (key) {
    case 'ArrowDown':
    case 'ArrowUp':
    case 'Home':
    case 'End':
      return moveRadio(index, key, count);
    default:
      return null;
  }
}
