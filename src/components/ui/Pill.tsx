interface PillProps {
  children: React.ReactNode;
  variant?: 'default' | 'accent' | 'muted' | 'success' | 'error';
  icon?: React.ReactNode;
  className?: string;
}

const variantClasses = {
  default: 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]',
  accent: 'bg-[var(--color-accent)]/15 text-[var(--color-accent-dark)]',
  muted: 'bg-[var(--color-muted)]/15 text-[var(--color-muted)]',
  success: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  error: 'bg-[var(--color-error-bg)] text-[var(--color-error)]',
};

export function Pill({ children, variant = 'default', icon, className = '' }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
