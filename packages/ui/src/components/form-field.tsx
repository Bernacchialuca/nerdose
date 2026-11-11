import { useId } from 'react';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';

import { cn } from '../cn';

import { FOCUS_RING } from './focus';

const CONTROL = cn(
  'w-full rounded-control border bg-control px-3.5 py-3 font-mono text-mono-body text-text placeholder:text-text-dim disabled:cursor-not-allowed disabled:text-text-disabled',
  FOCUS_RING,
);

type FieldShellProps = {
  label: ReactNode;
  error?: string | undefined;
  hint?: ReactNode;
  required?: boolean | undefined;
  render: (aria: {
    id: string;
    'aria-invalid': true | undefined;
    'aria-describedby': string | undefined;
    'aria-required': true | undefined;
    className: string;
  }) => ReactNode;
};

function FieldShell({ label, error, hint, required, render }: FieldShellProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ');
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="font-mono text-label-comment text-text-body">
        {label}
      </label>
      {render({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy || undefined,
        'aria-required': required ? true : undefined,
        className: cn(CONTROL, error ? 'border-error' : 'border-border-interactive'),
      })}
      {hint ? (
        <p id={hintId} className="font-sans text-caption text-text-dim">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="font-sans text-caption text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type FieldExtras = {
  label: ReactNode;
  error?: string | undefined;
  hint?: ReactNode;
  required?: boolean;
};

export type TextFieldProps = Omit<
  ComponentPropsWithoutRef<'input'>,
  'id' | 'className' | 'required'
> &
  FieldExtras & { inputRef?: Ref<HTMLInputElement> };

export function TextField({ label, error, hint, required, inputRef, ...rest }: TextFieldProps) {
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      render={(aria) => <input ref={inputRef} {...rest} {...aria} />}
    />
  );
}

export type TextAreaFieldProps = Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'id' | 'className' | 'required'
> &
  FieldExtras & { textareaRef?: Ref<HTMLTextAreaElement> };

export function TextAreaField({
  label,
  error,
  hint,
  required,
  textareaRef,
  ...rest
}: TextAreaFieldProps) {
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      render={(aria) => <textarea ref={textareaRef} rows={4} {...rest} {...aria} />}
    />
  );
}

export type SelectFieldProps = Omit<
  ComponentPropsWithoutRef<'select'>,
  'id' | 'className' | 'required'
> &
  FieldExtras & { selectRef?: Ref<HTMLSelectElement> };

export function SelectField({
  label,
  error,
  hint,
  required,
  selectRef,
  children,
  ...rest
}: SelectFieldProps) {
  return (
    <FieldShell
      label={label}
      error={error}
      hint={hint}
      required={required}
      render={(aria) => (
        <select ref={selectRef} {...rest} {...aria}>
          {children}
        </select>
      )}
    />
  );
}
