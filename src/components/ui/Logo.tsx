interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark';
}

export function Logo({ size = 48, variant = 'light' }: LogoProps) {
  const id = `logo-grad-${variant}-${size}`;

  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 2px 6px rgba(233, 185, 74, 0.35))' }}
    >
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F4C94A" />
          <stop offset="100%" stopColor="#D4A017" />
        </linearGradient>
      </defs>

      {/* Lucide Star — filled */}
      <path
        d="M23.163 3.81a1.13 1.13 0 0 1 1.674 0l4.937 5.34a2.407 2.407 0 0 0 1.807 1.242l5.904.857a1.13 1.13 0 0 1 .627 1.927l-4.27 4.152a2.407 2.407 0 0 0-.694 2.131l1.008 5.834a1.13 1.13 0 0 1-1.643 1.205L27.18 24.26a2.407 2.407 0 0 0-2.238 0l-5.263 2.77a1.13 1.13 0 0 1-1.643-1.206l1.008-5.833a2.407 2.407 0 0 0-.694-2.132L13.98 13.106a1.13 1.13 0 0 1 .627-1.927l5.904-.857a2.407 2.407 0 0 0 1.807-1.242z"
        fill={`url(#${id})`}
      />

      {/* Lucide House — negative space cutout */}
      <g fill={variant === 'light' ? '#0F2C2C' : '#1A2F2F'} fillRule="evenodd" opacity="0.9">
        <path d="M26.5 25.5v-5.5a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 0-.5 .5v5.5" />
        <path d="M16.5 16a1.5 1.5 0 0 1 .531-1.144l5.25-4.75a1.5 1.5 0 0 1 1.938 0l5.25 4.75A1.5 1.5 0 0 1 30 16v8.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 16 24.5z" />
      </g>
    </svg>
  );
}
