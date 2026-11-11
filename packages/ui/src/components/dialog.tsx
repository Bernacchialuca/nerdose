import { useEffect, useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';

import { cn } from '../cn';

import { buttonClass } from './button-class';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), summary, [tabindex]:not([tabindex="-1"])';

const OVERLAY = {
  modal: 'z-50 flex items-center justify-center px-4',
  drawer: 'z-40',
  sheet: 'z-50 flex items-end justify-center pt-12 sm:items-center sm:px-4 sm:pt-0',
} as const;

const PANEL = {
  modal: 'max-h-full w-full max-w-xl overflow-y-auto rounded-panel',
  drawer: 'fixed inset-y-0 right-0 w-full max-w-5xl overflow-y-auto',
  sheet:
    'max-h-full w-full overflow-y-auto rounded-t-panel border-b-0 sm:max-w-xl sm:rounded-panel sm:border-b',
} as const;

/** Marca `inert` a todo lo que rodea al nodo; devuelve la función que lo deshace. */
function makeOutsideInert(node: HTMLElement): () => void {
  const marked: Element[] = [];
  let current: Element = node;
  while (current.parentElement && current !== document.body) {
    const parent: HTMLElement = current.parentElement;
    for (const sibling of Array.from(parent.children)) {
      if (sibling === current || sibling.hasAttribute('inert')) continue;
      if (sibling.tagName === 'SCRIPT' || sibling.tagName === 'STYLE') continue;
      sibling.setAttribute('inert', '');
      marked.push(sibling);
    }
    current = parent;
  }
  return () => {
    for (const el of marked) el.removeAttribute('inert');
  };
}

export type DialogProps = {
  variant: 'modal' | 'drawer' | 'sheet';
  title: ReactNode;
  closeLabel: string;
  onClose: () => void;
  closeDisabled?: boolean;
  role?: 'dialog' | 'alertdialog';
  initialFocusRef?: RefObject<HTMLElement | null>;
  titleRef?: RefObject<HTMLHeadingElement | null>;
  /** Id del elemento que describe el diálogo (`aria-describedby`). */
  describedBy?: string;
  children: ReactNode;
};

export function Dialog({
  variant,
  title,
  closeLabel,
  onClose,
  closeDisabled = false,
  role = 'dialog',
  initialFocusRef,
  titleRef,
  describedBy,
  children,
}: DialogProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previous = document.activeElement;
    const restore = overlayRef.current ? makeOutsideInert(overlayRef.current) : () => undefined;
    (initialFocusRef?.current ?? closeRef.current)?.focus();
    return () => {
      // Primero quitar `inert`: un elemento inerte no puede recibir el foco de vuelta.
      restore();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [initialFocusRef]);

  const close = () => {
    if (!closeDisabled) onClose();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []);
    const first = items.at(0);
    const last = items.at(-1);
    if (!first || !last) return;
    const active = document.activeElement;
    if (event.shiftKey && (active === first || !panelRef.current?.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (active === last || !panelRef.current?.contains(active))) {
      event.preventDefault();
      first.focus();
    }
  };

  return (
    // El overlay no es un control: se descarta con Escape (manejado acá) o con el botón Cerrar.
    <div
      ref={overlayRef}
      role="presentation"
      className={cn('fixed inset-0 bg-header', OVERLAY[variant])}
      onKeyDown={onKeyDown}
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        className={cn('flex flex-col gap-5 border border-border bg-surface p-6', PANEL[variant])}
      >
        <div className="flex items-start justify-between gap-3">
          <h2
            id={titleId}
            ref={titleRef}
            tabIndex={-1}
            className="font-mono text-title-panel text-text"
          >
            {title}
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label={closeLabel}
            aria-disabled={closeDisabled || undefined}
            onClick={close}
            className={buttonClass({ variant: 'icon', disabled: closeDisabled })}
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
