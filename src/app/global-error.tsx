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
          background: '#FAF7F2',
          color: '#132E35',
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
          <p style={{ fontSize: '0.875rem', color: '#6B7C7F', marginBottom: '1.5rem' }}>
            حاول إعادة تحميل الصفحة
          </p>
          <button
            onClick={reset}
            style={{
              background: '#132E35',
              color: 'white',
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
