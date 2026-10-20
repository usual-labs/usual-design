import type { MouseEventHandler, ReactNode } from 'react';

type Props = {
  children: ReactNode;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  'aria-label'?: string;
  'aria-pressed'?: boolean;
};

export function Button({
  children,
  onClick,
  disabled,
  'aria-label': label,
  'aria-pressed': pressed,
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      className="rounded-panel border border-ink bg-ink px-4 py-2 text-sm font-medium text-surface hover:bg-muted disabled:opacity-50"
    >
      {children}
    </button>
  );
}
