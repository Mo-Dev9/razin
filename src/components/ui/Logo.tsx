interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark';
  className?: string;
}

const LOGO = {
  light: { house: '#0F2C2C', bars: '#E9B94A' },
  dark: { house: '#E9B94A', bars: '#1E4C48' },
};

export function Logo({ size = 48, variant = 'dark', className }: LogoProps) {
  const { house, bars } = LOGO[variant];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="رزين"
    >
      <path
        d="M32 12 L52 30 H48 V54 H16 V30 H12 Z"
        fill={house}
        fillRule="evenodd"
      />
      <path
        d="M18 42 H24 V54 H18 Z M28 37 H34 V54 H28 Z M38 33 H44 V54 H38 Z"
        fill={bars}
        fillRule="evenodd"
      />
    </svg>
  );
}