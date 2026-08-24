'use client';

interface NumberGridProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  icon: string;
}

export function NumberGrid({ value, onChange, label, icon }: NumberGridProps) {
  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-soft hover:scale-[1.02]">
      <div className="w-11 h-11 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
        <span className="text-xl">{icon}</span>
      </div>
      <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>
      <div className="flex gap-1.5 mt-1">
        {[1, 2, 3, 4, 5].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => onChange(num)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-all duration-200 ${
              value === num
                ? 'bg-[var(--color-primary)] text-white scale-110 shadow-soft'
                : 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-accent)] hover:text-[var(--color-primary)] hover:scale-110'
            }`}
          >
            {num}
          </button>
        ))}
      </div>
      <div className="flex justify-between w-full mt-1">
        <span className="text-[10px] text-[var(--color-text-muted)]">سيء</span>
        <span className="text-[10px] text-[var(--color-text-muted)]">ممتاز</span>
      </div>
    </div>
  );
}
