import type { ReactNode } from 'react';

export type IconProps = { className?: string };

function Icon({ size, className, children }: IconProps & { size: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

/** Lucide `circle-help`. */
export function HelpIcon({ className }: IconProps) {
  return (
    <Icon size={18} className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </Icon>
  );
}

/** Gráfico de barras del DS (Estadísticas). */
export function ChartIcon({ className }: IconProps) {
  return (
    <Icon size={18} className={className}>
      <path d="M3 3v18h18" />
      <path d="M8 17V11" />
      <path d="M13 17V7" />
      <path d="M18 17v-4" />
    </Icon>
  );
}

/** Lucide `share`. */
export function ShareIcon({ className }: IconProps) {
  return (
    <Icon size={16} className={className}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <polyline points="16 6 12 2 8 6" />
      <line x1="12" x2="12" y1="2" y2="15" />
    </Icon>
  );
}
