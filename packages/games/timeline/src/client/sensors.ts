import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type SensorDescriptor,
  type SensorOptions,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';

type Activators = (typeof PointerSensor)['activators'];

/**
 * Pointer sensor limited to mouse/pen: a touch is handled only by `TouchSensor`, so the two never
 * compete (touch needs a short press, which lets the rest of the row scroll).
 */
export class MousePointerSensor extends PointerSensor {
  static override activators: Activators = [
    {
      eventName: 'onPointerDown',
      handler: ({ nativeEvent: event }, { onActivation }) => {
        if (!event.isPrimary || event.button !== 0 || event.pointerType === 'touch') return false;
        onActivation?.({ event });
        return true;
      },
    },
  ];
}

export function useTimelineSensors(): SensorDescriptor<SensorOptions>[] {
  return useSensors(
    useSensor(MousePointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}
