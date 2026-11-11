import { describe, expect, it } from 'vitest';

import { stubSortableRects } from './dnd-rects';

describe('stubSortableRects', () => {
  it('mide los li de un ol, respeta el resto y restaura', () => {
    const original = Element.prototype.getBoundingClientRect;
    document.body.innerHTML = '<ol><li></li><li></li><li></li></ol><div></div>';
    const restore = stubSortableRects();
    const tops = Array.from(document.querySelectorAll('li')).map(
      (li) => li.getBoundingClientRect().top,
    );
    expect(tops).toEqual([0, 60, 120]);
    expect(document.querySelector('div')?.getBoundingClientRect().height).toBe(0);
    restore();
    expect(Element.prototype.getBoundingClientRect).toBe(original);
  });
});
