interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'dark' | 'gradient' | 'error';
}

const variantClasses = {
  default: 'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-soft',
  dark: 'bg-[var(--color-primary)] text-white',
  gradient: 'card-gradient text-white',
  error: 'bg-[var(--color-error-bg)] border border-[var(--color-error)]/20',
};

export function Card({ children, className = '', variant = 'default' }: CardProps) {
  return (
    <div className={`rounded-3xl ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
}
