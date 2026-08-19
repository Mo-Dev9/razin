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
          background: '#0F172A',
          color: '#F8FAFC',
          fontFamily: "'Segoe UI', Tahoma, Arial, sans-serif",
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
          <p style={{ fontSize: '0.875rem', color: '#94A3B8', marginBottom: '1.5rem' }}>
            حاول إعادة تحميل الصفحة
          </p>
          <button
            onClick={reset}
            style={{
              background: '#14B8A6',
              color: 'white',
              border: 'none',
              borderRadius: '0.75rem',
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
