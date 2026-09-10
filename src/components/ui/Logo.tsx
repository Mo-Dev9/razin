import Image from 'next/image';

interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark';
}

export function Logo({ size = 48 }: LogoProps) {
  return (
    <Image
      src="/logo-128.png"
      alt="رزين"
      width={size}
      height={size}
      className="object-contain"
      priority={size >= 48}
    />
  );
}