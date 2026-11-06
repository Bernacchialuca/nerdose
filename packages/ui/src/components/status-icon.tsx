export type StatusIconProps = { tone: 'error' | 'warning' };

export function StatusIcon({ tone }: StatusIconProps) {
  const isError = tone === 'error';
  return (
    <span
      aria-hidden="true"
      className={
        isError
          ? 'flex size-10 flex-none items-center justify-center rounded-full bg-status-error text-status-error-on'
          : 'flex size-10 flex-none items-center justify-center rounded-full bg-status-warning text-status-warning-on'
      }
    >
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
        {isError ? (
          <>
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </>
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
