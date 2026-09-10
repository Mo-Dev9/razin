import Image from 'next/image';

interface LogoProps {
  size?: number;
  variant?: 'light' | 'dark';
}

export function Logo({ size = 48 }: LogoProps) {
  // `variant` يبقى في الواجهة للتوافق مع الاستخدامات الحالية،
  // لكن المارك الجديد (logo-razin.svg) مبني بألوان الهوية الثابتة
  // ويعمل بخلفيات فاتحة وداكنة دون الحاجة لتغيير المصدر.
  return (
    <Image
      src="/logo-razin.svg"
      alt="رزين"
      width={size}
      height={size}
      className="object-contain"
      priority={size >= 48}
    />
  );
}