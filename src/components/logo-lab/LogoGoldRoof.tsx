type LogoGoldRoofProps = {
  size?: number;
  variant?: 'light' | 'dark';
  className?: string;
};

export default function LogoGoldRoof({
  size = 48,
  variant = 'light',
  className,
}: LogoGoldRoofProps) {
  const isLight = variant !== 'dark';
  const tile = isLight ? '#F2EDE5' : '#0F2C2C';
  const pane = isLight ? '#0F2C2C' : '#F2EDE5';
  const gold = '#E9B94A';
  const windowBg = '#1E4C48';

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
    >
      <path
        d="M18 26 H46 A6 6 0 0 1 52 32 V52 A6 6 0 0 1 46 58 H18 A6 6 0 0 1 12 52 V32 A6 6 0 0 1 18 26 Z"
        fill={tile}
        fillRule="evenodd"
      />
      <path d="M32 8 L54 28 H10 Z" fill={gold} fillRule="evenodd" />
      <path
        d="M22 38 H31 V42 H22 Z M33 38 H42 V42 H33 Z M22 44 H31 V48 H22 Z M33 44 H42 V48 H33 Z"
        fill={pane}
        fillRule="evenodd"
      />
      <path
        d="M23 36 H41 A3 3 0 0 1 44 39 V47 A3 3 0 0 1 41 50 H23 A3 3 0 0 1 20 47 V39 A3 3 0 0 1 23 36 Z M22 38 H31 V42 H22 Z M33 38 H42 V42 H33 Z M22 44 H31 V48 H22 Z M33 44 H42 V48 H33 Z"
        fill={windowBg}
        fillRule="evenodd"
      />
    </svg>
  );
}