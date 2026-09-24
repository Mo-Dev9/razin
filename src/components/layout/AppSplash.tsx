'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * شاشة تحميل أولية تُبثّ مع أول بايتات الصفحة (قبل تحميل CSS/JS/الخطوط)
 * بألوان inline مستقلة عن أي ملف خارجي، فتُرى فورًا على النت البطيء
 * بدل صفحة بيضاء، ثم تختفي بمجرد اكتمال الـ hydration للـ layout.
 */
export function AppSplash() {
  const [gone, setGone] = useState(false);
  const shown = useRef(false);

  useEffect(() => {
    if (!shown.current) {
      shown.current = true;
      setGone(true);
    }
  }, []);

  if (gone) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F8F5F0',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 40,
            height: 40,
            margin: '0 auto 0.75rem',
            borderRadius: '50%',
            border: `3px solid #0F2C2C`,
            borderTopColor: 'transparent',
            animation: 'rz-splash-spin 0.9s linear infinite',
          }}
        />
        <div
          style={{
            fontFamily:
              'Tajawal, system-ui, "Segoe UI", Tahoma, Arial, sans-serif',
            fontSize: 15,
            fontWeight: 700,
            color: '#0F2C2C',
          }}
        >
          رزين
        </div>
      </div>
      <style>{`@keyframes rz-splash-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}