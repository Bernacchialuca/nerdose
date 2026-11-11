import { useId, useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';

import { navItemClass } from './nav-item-class';

export type TabItem<T extends string> = { value: T; label: string };

export type TabsProps<T extends string> = {
  label: string;
  tabs: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  children: ReactNode;
};

export function Tabs<T extends string>({ label, tabs, value, onChange, children }: TabsProps<T>) {
  const baseId = useId();
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const panelId = `${baseId}-panel`;

  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.findIndex((t) => t.value === value);
    let next = index;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    else return;
    event.preventDefault();
    const target = tabs[next];
    if (!target) return;
    onChange(target.value);
    refs.current[target.value]?.focus();
  };

  return (
    <div className="flex flex-col gap-3">
      <div role="tablist" aria-label={label} className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const selected = tab.value === value;
          return (
            <button
              key={tab.value}
              ref={(el) => {
                refs.current[tab.value] = el;
              }}
              id={`${baseId}-tab-${tab.value}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={panelId}
              tabIndex={selected ? 0 : -1}
              onKeyDown={move}
              onClick={() => {
                onChange(tab.value);
              }}
              className={navItemClass({ active: selected })}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div id={panelId} role="tabpanel" aria-labelledby={`${baseId}-tab-${value}`}>
        {children}
      </div>
    </div>
  );
}
