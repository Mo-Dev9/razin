import Image from 'next/image';

interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark';
}

export function Logo({ size = 48, variant = 'light' }: LogoProps) {
  const src = variant === 'dark' ? '/logo-128.png' : '/logo-128.png';

  return (
    <Image
      src={src}
      alt="RentRate Logo"
      width={size}
      height={size}
      className="object-contain"
      priority={size >= 48}
    />
  );
}
