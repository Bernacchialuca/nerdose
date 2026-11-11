/**
 * jsdom no mide layout: dnd-kit necesita rectángulos para el `KeyboardSensor`. Da medidas a cada `<li>`
 * hijo de un `<ol>` (top = índice entre hermanos × 60) y deja el resto con el valor original.
 */
export function stubSortableRects(): () => void {
  const original = Element.prototype.getBoundingClientRect;
  Element.prototype.getBoundingClientRect = function (this: Element) {
    if (this.tagName === 'LI' && this.parentElement?.tagName === 'OL') {
      const top = Array.from(this.parentElement.children).indexOf(this) * 60;
      return {
        x: 0,
        y: top,
        top,
        left: 0,
        width: 300,
        height: 52,
        right: 300,
        bottom: top + 52,
        toJSON: () => ({}),
      } as DOMRect;
    }
    return original.call(this);
  };
  return () => {
    Element.prototype.getBoundingClientRect = original;
  };
}
