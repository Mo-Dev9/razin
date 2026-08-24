'use client';

interface NumberGridProps {
  value: number;
  onChange: (val: number) => void;
  label: string;
  icon: string;
}

export function NumberGrid({ value, onChange, label, icon }: NumberGridProps) {
  const percent = ((value - 1) / 4) * 100;

  const getColor = (v: number) => {
    if (v <= 2) return 'var(--color-error)';
    if (v <= 3) return 'var(--color-accent)';
    return 'var(--color-success)';
  };

  const color = getColor(value);

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col items-center gap-2 hover:shadow-soft hover:scale-[1.02]">
      <div className="w-11 h-11 rounded-full bg-[var(--color-accent)] flex items-center justify-center">
        <span className="text-xl">{icon}</span>
      </div>
      <span className="text-sm font-semibold text-[var(--color-text)]">{label}</span>

      <div
        className="text-2xl font-bold mt-1 transition-colors duration-200"
        style={{ color }}
      >
        {value}
      </div>

      <div className="w-full" dir="ltr">
        <div className="relative w-full h-8 flex items-center">
          <div className="absolute w-full h-2 rounded-full bg-[var(--color-surface-warm)] border border-[var(--color-border-light)]"></div>
          <div
            className="absolute h-2 rounded-full transition-all duration-150"
            style={{
              width: `${percent}%`,
              background: `linear-gradient(to right, var(--color-error), var(--color-accent), var(--color-success))`,
            }}
          ></div>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="absolute w-full h-8 opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute w-5 h-5 rounded-full bg-white border-[3px] shadow-md pointer-events-none transition-all duration-150"
            style={{
              left: `calc(${percent}% - 10px)`,
              borderColor: color,
              boxShadow: `0 0 8px ${color}40`,
            }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between w-full mt-0.5">
        <span className="text-[10px] text-[var(--color-error)] font-medium">سيء</span>
        <span className="text-[10px] text-[var(--color-success)] font-medium">ممتاز</span>
      </div>
    </div>
  );
}
