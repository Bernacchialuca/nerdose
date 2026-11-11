import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

/**
 * `useSortable` for a Timeline row. No layout transition at all (DS `motion`: state changes are
 * instant), and the drag transform goes through `style` because it is a runtime value.
 */
export function useRowSortable(id: string, disabled: boolean, roleDescription: string) {
  const sortable = useSortable({
    id,
    disabled,
    transition: null,
    attributes: { roleDescription },
  });
  return { ...sortable, style: { transform: CSS.Transform.toString(sortable.transform) } };
}
