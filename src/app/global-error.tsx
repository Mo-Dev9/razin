'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          background: '#0F2C2C',
          color: '#E8E4DA',
          fontFamily: "'Cairo', 'Segoe UI', Tahoma, Arial, sans-serif",
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: 0,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💥</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
            خطأ غير متوقع
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#9FB8B4', marginBottom: '1.5rem' }}>
            حاول إعادة تحميل الصفحة
          </p>
          <button
            onClick={reset}
            style={{
              background: '#E9B94A',
              color: '#0F2C2C',
              border: 'none',
              borderRadius: '999px',
              padding: '0.75rem 1.5rem',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            حاول تاني
          </button>
        </div>
      </body>
    </html>
  );
}
