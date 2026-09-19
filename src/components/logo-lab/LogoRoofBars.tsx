type LogoRoofBarsProps = {
  size?: number;
  variant?: 'light' | 'dark';
  className?: string;
};

export default function LogoRoofBars({
  size = 48,
  variant = 'light',
  className,
}: LogoRoofBarsProps) {
  const isLight = variant !== 'dark';
  const panel = isLight ? '#F2EDE5' : '#0F2C2C';
  const bars = isLight ? '#0F2C2C' : '#1E4C48';
  const gold = '#E9B94A';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
    >
      <path
        d="M14 12 H50 A4 4 0 0 1 54 16 V56 A4 4 0 0 1 50 60 H14 A4 4 0 0 1 10 56 V16 A4 4 0 0 1 14 12 Z"
        fill={panel}
        fillRule="evenodd"
      />
      <path d="M32 18 L48 34 H16 Z" fill={gold} fillRule="evenodd" />
      <path
        d="M18 45 H24 V56 H18 Z M28 41 H34 V56 H28 Z M38 37 H44 V56 H38 Z"
        fill={bars}
        fillRule="evenodd"
      />
    </svg>
  );
}