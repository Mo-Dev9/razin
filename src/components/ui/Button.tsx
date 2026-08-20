'use client';

import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variants = {
  primary: 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)]',
  secondary: 'bg-[var(--color-surface-warm)] text-[var(--color-text)] hover:bg-[var(--color-border)]',
  accent: 'bg-[var(--color-accent)] text-[var(--color-primary)] hover:bg-[var(--color-accent-dark)]',
  outline: 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-warm)]',
  ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-surface-warm)]',
  danger: 'bg-[var(--color-error)] text-white hover:opacity-90',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3 text-base',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={`rounded-full font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? 'جاري التحميل...' : children}
    </button>
  );
}
