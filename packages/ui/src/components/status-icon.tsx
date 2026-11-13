export type StatusIconProps = { tone: 'error' | 'warning' | 'success' };

const TONE_CLASSES: Record<StatusIconProps['tone'], string> = {
  error:
    'flex size-10 flex-none items-center justify-center rounded-full bg-status-error text-status-error-on',
  warning:
    'flex size-10 flex-none items-center justify-center rounded-full border-2 border-status-warning text-status-warning',
  success:
    'flex size-10 flex-none items-center justify-center rounded-full bg-status-success text-status-success-on',
};

export function StatusIcon({ tone }: StatusIconProps) {
  return (
    <span aria-hidden="true" className={TONE_CLASSES[tone]}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {tone === 'error' ? (
          <>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </>
        ) : tone === 'success' ? (
          <path d="M20 6 9 17l-5-5" />
        ) : (
          <>
            <path d="M12 7v6" />
            <path d="M12 17h.01" />
          </>
        )}
      </svg>
    </span>
  );
}
