import type { ReactNode, Ref } from 'react';

import { cn } from '@nerdose/ui';

export type ErrorTerminalProps = {
  /** Comando que "falló", sin el prompt (`cd /ruta`). */
  command: string;
  /** Salida del comando, en rojo. */
  output: string;
  exitCode: number;
  title: string;
  titleRef?: Ref<HTMLHeadingElement>;
  message: ReactNode;
  actions: ReactNode;
  className?: string;
};

/**
 * Pantalla de error con la estética de la ventana de terminal de la home: la transcripción
 * es decorativa (`aria-hidden`) y el `h1` y el mensaje cuentan lo mismo en prosa.
 */
export function ErrorTerminal({
  command,
  output,
  exitCode,
  title,
  titleRef,
  message,
  actions,
  className,
}: ErrorTerminalProps) {
  return (
    <section
      className={cn(
        'min-w-0 overflow-hidden rounded-panel border border-border bg-surface shadow-window',
        className,
      )}
    >
      <div
        aria-hidden="true"
        className="flex items-center gap-2 border-b border-border-subtle bg-titlebar px-4 py-3 font-mono"
      >
        <span className="size-2.75 flex-none rounded-full bg-window-dot" />
        <span className="size-2.75 flex-none rounded-full bg-window-dot" />
        <span className="size-2.75 flex-none rounded-full bg-window-dot" />
        <span className="ml-2 truncate text-meta text-text-dim">nerdose — bash</span>
      </div>
      <div
        aria-hidden="true"
        className="flex flex-col gap-1 px-5.5 pt-5.5 font-mono text-code-terminal break-all"
      >
        <p className="text-text">
          <span className="text-accent">$ </span>
          {command}
        </p>
        <p className="text-status-error">{output}</p>
        <p className="text-text-dim">
          exit {exitCode}
          <span className="text-accent motion-safe:animate-blink">▌</span>
        </p>
      </div>
      <div className="mt-5 flex flex-col gap-3 border-t border-dashed border-border-strong px-5.5 pt-5 pb-6">
        <h1
          ref={titleRef}
          tabIndex={-1}
          className="font-mono text-title-page break-words text-text"
        >
          {title}
        </h1>
        <p className="text-body text-text-lede">{message}</p>
        <div className="mt-2 flex flex-col gap-3">{actions}</div>
      </div>
    </section>
  );
}
