import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '../cn';

import { GAME_CLASSES, type UiGameId } from './game-classes';

type ArticleProps = ComponentPropsWithoutRef<'article'>;

export type CardProps =
  | (ArticleProps & { variant?: 'game'; game?: UiGameId; next?: boolean; thumbnail?: ReactNode })
  | (ArticleProps & { variant: 'placeholder' })
  | (ArticleProps & { variant: 'step'; kicker: ReactNode; tone?: 'brand' | UiGameId })
  | { variant: 'mini-stat'; value: ReactNode; label: ReactNode; className?: string };

function withoutVariant<T extends { variant?: unknown }>(props: T): Omit<T, 'variant'> {
  const { variant, ...rest } = props;
  void variant;
  return rest;
}

export function Card(props: CardProps) {
  if (props.variant === 'mini-stat') {
    const { value, label, className } = withoutVariant(props);
    return (
      <div
        className={cn('flex flex-col gap-1 rounded-inset bg-surface-inset px-4 py-3.5', className)}
      >
        <span className="font-mono text-numeric-md text-text">{value}</span>
        <span className="font-sans text-caption-tight text-text-muted">{label}</span>
      </div>
    );
  }

  if (props.variant === 'placeholder') {
    const { className, ...rest } = withoutVariant(props);
    return (
      <article
        className={cn(
          'flex min-h-75 flex-col justify-center gap-3 rounded-feature border border-dashed border-border-strong p-7',
          className,
        )}
        {...rest}
      />
    );
  }

  if (props.variant === 'step') {
    const { kicker, tone = 'brand', className, children, ...rest } = withoutVariant(props);
    return (
      <article
        className={cn(
          'flex flex-col gap-2 rounded-panel border border-border-subtle p-5.5',
          className,
        )}
        {...rest}
      >
        <p
          className={cn(
            'font-mono text-mono-body',
            tone === 'brand' ? 'text-accent' : GAME_CLASSES[tone].text,
          )}
        >
          {kicker}
        </p>
        <div className="font-sans text-body text-text-body">{children}</div>
      </article>
    );
  }

  const { game, next, thumbnail, className, children, ...rest } = withoutVariant(props);
  const classes = game ? GAME_CLASSES[game] : undefined;
  const featured = Boolean(next && classes);
  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-feature border bg-surface',
        featured && classes ? [classes.featuredBorder, classes.nextShadow] : 'border-border',
        className,
      )}
      {...rest}
    >
      {thumbnail ? (
        <div
          aria-hidden="true"
          className={cn(
            'flex h-37.5 flex-none items-center justify-center overflow-hidden border-b',
            classes
              ? [classes.tintBg, classes.tintBorder]
              : 'border-border-subtle bg-surface-inset',
          )}
        >
          {thumbnail}
        </div>
      ) : null}
      <div className="flex flex-1 flex-col gap-3 p-5">{children}</div>
    </article>
  );
}
