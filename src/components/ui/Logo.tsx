import Image from 'next/image';

interface LogoProps {
  size?: number;
  variant?: 'dark' | 'light';
  className?: string;
}

export function Logo({ size = 48, variant = 'dark', className }: LogoProps) {
  void variant;
  return (
    <Image
      src="/logo/gold/logo-192.png"
      alt="رزين"
      width={size}
      height={size}
      className={className}
      priority
    />
  );
}