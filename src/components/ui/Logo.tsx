interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark';
  showWordmark?: boolean;
}

export function Logo({ size = 48, variant = 'light', showWordmark = false }: LogoProps) {
  const starColor = variant === 'light' ? '#E9B94A' : '#FAF4EB';
  const cutoutColor = variant === 'light' ? '#0F2C2C' : '#134B4A';

  return (
    <div className="flex items-center gap-2.5">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 48 48"
          width={size}
          height={size}
          style={{ filter: `drop-shadow(0 2px 8px rgba(233, 185, 74, ${variant === 'light' ? '0.4' : '0.3'}))` }}
        >
          {/* Five-pointed star */}
          <path
            d="M24 2 L29.8 16.8 L46 16.8 L33.2 26.4 L37.8 42 L24 33.2 L10.2 42 L14.8 26.4 L2 16.8 L18.2 16.8 Z"
            fill={starColor}
          />
          {/* House silhouette cutout in center */}
          <path
            d="M24 14 L30 19.5 L30 28 L27 28 L27 22 L21 22 L21 28 L18 28 L18 19.5 Z"
            fill={cutoutColor}
            opacity="0.85"
          />
        </svg>
      </div>
      {showWordmark && (
        <div className="flex items-baseline gap-0.5">
          <span className="text-lg font-bold tracking-tight" style={{ color: variant === 'light' ? 'var(--color-text)' : '#FAF4EB' }}>
            Rent
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ color: variant === 'light' ? 'var(--color-text)' : '#FAF4EB' }}>
            Rate
          </span>
          <span className="text-sm" style={{ color: '#E9B94A' }}>★</span>
        </div>
      )}
    </div>
  );
}
