import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate } from 'react-router';

import { Alert, AppHeader, Banner, BrandMark, buttonClass } from '@nerdose/ui';

import { TextField } from '@/components/form-field';
import { usePageTitle } from '@/hooks/use-page-title';
import { isApiError } from '@/lib/api-errors';

import { useLogin } from '../api/login';
import { useAuth } from '../auth-context';

const DEFAULT_RETRY_AFTER_SECONDS = 900;

type FormError = 'empty' | 'invalid' | 'system' | null;

const FIELD_ERRORS = {
  empty: 'Ingresá la contraseña.',
  invalid: 'Contraseña incorrecta.',
} as const;

export function Component() {
  const { isAuthenticated, endReason } = useAuth();
  usePageTitle('Ingresar · Admin · nerdose', { focusHeading: false });
  const login = useLogin();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<FormError>(null);
  const [submitted, setSubmitted] = useState(false);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (lockedUntil === null) return undefined;
    const id = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(id);
    };
  }, [lockedUntil]);

  if (isAuthenticated) return <Navigate to="/reports" replace />;

  const remaining = lockedUntil === null ? 0 : lockedUntil - now;
  const locked = remaining > 0;
  const pending = login.isPending;
  const blocked = locked || pending;

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (blocked) return;
    setSubmitted(true);
    if (password === '') {
      setError('empty');
      inputRef.current?.focus();
      return;
    }
    setError(null);
    login.mutate(password, {
      onError: (err) => {
        if (isApiError(err, 'invalid_credentials')) {
          setError('invalid');
        } else if (isApiError(err, 'rate_limited')) {
          const current = Date.now();
          setNow(current);
          setLockedUntil(current + (err.retryAfter ?? DEFAULT_RETRY_AFTER_SECONDS) * 1000);
        } else {
          setError('system');
        }
      },
    });
  };

  const minutes = Math.ceil(remaining / 60_000);

  return (
    <div className="min-h-dvh bg-bg font-mono text-text">
      <AppHeader brand={<BrandMark label="nerdose admin" />} />
      <main className="mx-auto grid max-w-page grid-cols-1 px-4 py-12 lg:grid-cols-3 lg:px-12">
        <div className="flex flex-col gap-5 lg:col-start-2">
          <div className="flex flex-col gap-1.5">
            <h1 className="font-mono text-title-page text-text">Ingresar</h1>
            <p className="font-sans text-body-sm text-text-muted">
              Panel del responsable de nerdose.
            </p>
          </div>
          {endReason === 'expired' && !submitted ? (
            <div role="alert">
              <Banner
                variant="warning"
                announce={false}
                title="La sesión venció, ingresá de nuevo."
              />
            </div>
          ) : null}
          {locked ? (
            <div role="alert">
              <Banner
                variant="warning"
                announce={false}
                title={`Demasiados intentos. Probá de nuevo en ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}.`}
              />
            </div>
          ) : null}
          {error === 'system' ? (
            <Alert title="No pudimos conectarnos con el servidor. Probá de nuevo." />
          ) : null}
          <form noValidate onSubmit={submit} className="flex flex-col gap-5">
            <TextField
              label="Contraseña"
              name="password"
              type="password"
              autoComplete="current-password"
              inputRef={inputRef}
              value={password}
              disabled={blocked}
              error={error === 'empty' || error === 'invalid' ? FIELD_ERRORS[error] : undefined}
              onChange={(event) => {
                setPassword(event.target.value);
              }}
            />
            <button
              type="submit"
              aria-disabled={blocked || undefined}
              className={buttonClass({
                variant: 'primary',
                size: 'lg',
                fullWidth: true,
                disabled: blocked,
              })}
            >
              {pending ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
