interface VerifiedBadgeProps {
  size?: number;
  label?: string;
}

export function VerifiedBadge({ size = 20, label }: VerifiedBadgeProps) {
  const id = `verified-grad-${size}`;

  return (
    <span className="inline-flex items-center gap-1" title="تقييم موثّق">
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#F4C94A" />
            <stop offset="1" stopColor="#D4A017" />
          </linearGradient>
        </defs>

        {/* Seal disc with keyhole knockout */}
        <path
          fill={`url(#${id})`}
          fillRule="evenodd"
          d="M20,42 A30,30 0 1 0 80,42 A30,30 0 1 0 20,42 Z
             M43.9,41.9 A7,7 0 1 1 56.1,41.9 L59.5,60 L40.5,60 Z"
        />
      </svg>
      {label && (
        <span className="text-xs font-medium text-text-secondary">{label}</span>
      )}
    </span>
  );
}
