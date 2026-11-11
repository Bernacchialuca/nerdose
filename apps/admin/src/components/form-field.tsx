import { useId } from 'react';
import type { ComponentPropsWithoutRef, ReactNode, Ref, TextareaHTMLAttributes } from 'react';

import { cn } from '@nerdose/ui';

const CONTROL =
  'w-full rounded-control border bg-control px-3.5 py-3 font-mono text-mono-body text-text placeholder:text-text-dim focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:text-text-disabled';

type FieldShellProps = {
  label: ReactNode;
  error?: string | undefined;
  render: (aria: {
    id: string;
    'aria-invalid': true | undefined;
    'aria-describedby': string | undefined;
    'aria-required': true;
    className: string;
  }) => ReactNode;
};

function FieldShell({ label, error, render }: FieldShellProps) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-label-comment text-text-body">
        {label}
      </label>
      {render({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        'aria-required': true,
        className: cn(CONTROL, error ? 'border-error' : 'border-border-interactive'),
      })}
      {error ? (
        <p id={errorId} className="font-sans text-caption text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<ComponentPropsWithoutRef<'input'>, 'id' | 'className'> & {
  label: ReactNode;
  error?: string | undefined;
  inputRef?: Ref<HTMLInputElement>;
};

export function TextField({ label, error, inputRef, ...rest }: TextFieldProps) {
  return (
    <FieldShell
      label={label}
      error={error}
      render={(aria) => <input ref={inputRef} {...rest} {...aria} />}
    />
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'className'> & {
  label: ReactNode;
  error?: string | undefined;
  textareaRef?: Ref<HTMLTextAreaElement>;
};

export function TextAreaField({ label, error, textareaRef, ...rest }: TextAreaFieldProps) {
  return (
    <FieldShell
      label={label}
      error={error}
      render={(aria) => <textarea ref={textareaRef} rows={4} {...rest} {...aria} />}
    />
  );
}

type SelectFieldProps = Omit<ComponentPropsWithoutRef<'select'>, 'id' | 'className'> & {
  label: ReactNode;
  error?: string | undefined;
  selectRef?: Ref<HTMLSelectElement>;
};

export function SelectField({ label, error, selectRef, children, ...rest }: SelectFieldProps) {
  return (
    <FieldShell
      label={label}
      error={error}
      render={(aria) => (
        <select ref={selectRef} {...rest} {...aria}>
          {children}
        </select>
      )}
    />
  );
}
