import { afterEach, describe, expect, it } from 'vitest';

import { focusMainHeading } from './focus-main-heading';

afterEach(() => {
  document.body.innerHTML = '';
});

describe('focusMainHeading', () => {
  it('pone tabindex="-1" y enfoca el h1 de main', () => {
    document.body.innerHTML = '<main><h1>Hola</h1></main>';
    focusMainHeading();
    const h1 = document.querySelector('h1');
    expect(h1).toHaveAttribute('tabindex', '-1');
    expect(h1).toHaveFocus();
  });

  it('el título enfocado no muestra anillo de foco', () => {
    document.body.innerHTML = '<main><h1>Hola</h1></main>';
    focusMainHeading();
    expect(document.querySelector('h1')).toHaveClass('outline-none');
  });

  it('respeta un tabindex existente', () => {
    document.body.innerHTML = '<main><h1 tabindex="0">Hola</h1></main>';
    focusMainHeading();
    expect(document.querySelector('h1')).toHaveAttribute('tabindex', '0');
  });

  it('no falla sin h1', () => {
    document.body.innerHTML = '<main><p>x</p></main>';
    expect(() => focusMainHeading()).not.toThrow();
  });
});
