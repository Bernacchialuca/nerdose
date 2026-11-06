import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

import { RADIUS_ROLES, SHADOW_ROLES, TEXT_ROLES } from './theme';

const twMerge = extendTailwindMerge({
  extend: {
    theme: { text: [...TEXT_ROLES], radius: [...RADIUS_ROLES], shadow: [...SHADOW_ROLES] },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
