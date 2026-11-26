import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

import { Pagination, usePagination } from './pagination';

describe('Pagination', () => {
  it('shows the range and moves between pages', async () => {
    const onChange = vi.fn();
    render(
      <Pagination
        page={2}
        totalPages={3}
        total={60}
        pageSize={25}
        noun="términos"
        onChange={onChange}
      />,
    );
    expect(screen.getByText(/26–50 de 60 términos · página 2 de 3/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Anterior/ }));
    await userEvent.click(screen.getByRole('button', { name: /Siguiente/ }));
    expect(onChange.mock.calls).toEqual([[1], [3]]);
  });

  it('disables the ends', async () => {
    const onChange = vi.fn();
    render(
      <Pagination
        page={1}
        totalPages={2}
        total={30}
        pageSize={25}
        noun="días"
        onChange={onChange}
      />,
    );
    const prev = screen.getByRole('button', { name: /Anterior/ });
    expect(prev).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(prev);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/1–25 de 30 días/)).toBeInTheDocument();
  });

  it('renders nothing with a single page', () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} total={5} pageSize={25} noun="días" onChange={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <Pagination
        page={2}
        totalPages={3}
        total={60}
        pageSize={25}
        noun="días"
        onChange={vi.fn()}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe('usePagination', () => {
  it('slices the items and clamps the page when the list shrinks', () => {
    const { result, rerender } = renderHook(({ items }) => usePagination(items, 2), {
      initialProps: { items: [1, 2, 3, 4, 5] },
    });
    expect(result.current.pageItems).toEqual([1, 2]);
    expect(result.current.totalPages).toBe(3);
    act(() => {
      result.current.setPage(3);
    });
    expect(result.current.pageItems).toEqual([5]);
    rerender({ items: [1, 2] });
    expect(result.current.page).toBe(1);
    expect(result.current.pageItems).toEqual([1, 2]);
  });
});
