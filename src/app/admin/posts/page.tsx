'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter as Footer } from '@/components/layout/SiteFooter';
import { LogoutButton } from '@/components/admin/LogoutButton';

interface ModPost {
  id: string;
  displayName?: string;
  text?: string;
  createdAt?: number;
  reportCount?: number;
}

function formatDate(ts?: number): string {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function AdminPostsPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [posts, setPosts] = useState<ModPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/session')
      .then((res) => {
        if (res.status === 401) router.push('/admin/login');
        else setChecked(true);
      })
      .catch(() => router.push('/admin/login'));
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    let cancelled = false;
    fetch('/api/admin/posts')
      .then(async (res) => {
        if (res.status === 401) {
          router.push('/admin/login');
          return;
        }
        if (!res.ok) throw new Error('load');
        const data = (await res.json()) as { posts?: ModPost[] };
        if (!cancelled) setPosts(data.posts ?? []);
      })
      .catch(() => {
        if (!cancelled) setError('تعذر تحميل منشورات الإشراف');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [checked, router]);

  async function moderate(post: ModPost, action: 'restore' | 'delete') {
    if (action === 'delete' && !window.confirm('حذف المنشور نهائيًا؟ لا يمكن التراجع.')) return;
    setBusyId(post.id);
    setError(null);
    try {
      const res = await fetch('/api/admin/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, action }),
      });
      if (!res.ok) throw new Error('moderate');
      setPosts((prev) => prev.filter((p) => p.id !== post.id));
    } catch {
      setError('تعذر تنفيذ الإجراء — حاول مجددًا');
    } finally {
      setBusyId(null);
    }
  }

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--color-text-secondary)]">
        جارٍ التحقق…
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto max-w-3xl px-4 py-8 w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">إشراف الحارة</h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              المنشورات المبلَّغ عنها بانتظار مراجعتك — من وصَل لبلاغين أُخفي من العرض فورًا، وما دون ذلك بقي ظاهرًا حتى قرارك.
            </p>
          </div>
          <LogoutButton />
        </div>

        {error && (
          <div className="mb-4 rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 text-sm font-bold text-[var(--color-error)]">
            {error}
          </div>
        )}

        {loading && <p className="py-10 text-center text-sm text-[var(--color-text-secondary)]">جارٍ التحميل…</p>}
        {!loading && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-warm)] px-6 py-10 text-center text-sm text-[var(--color-text-secondary)]">
            لا توجد منشورات بانتظار المراجعة — الحارة نظيفة.
          </div>
        )}

        <div className="grid gap-4">
          {posts.map((post) => (
            <article key={post.id} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] p-5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-[var(--color-primary)]">{post.displayName ?? 'منشور مجهول'}</span>
                  <span className="rounded-full bg-[var(--color-error)]/15 px-2.5 py-0.5 font-bold text-[var(--color-error)]">
                    {post.reportCount ?? 0} بلاغ
                  </span>
                </div>
                <span className="text-[var(--color-text-muted)]">{formatDate(post.createdAt)}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">{post.text}</p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  disabled={busyId === post.id}
                  onClick={() => void moderate(post, 'restore')}
                  className="rounded-full bg-[var(--color-success-light)] px-4 py-1.5 text-xs font-bold text-[var(--color-success)] transition-colors hover:opacity-80 disabled:opacity-50"
                >
                  استعادة
                </button>
                <button
                  type="button"
                  disabled={busyId === post.id}
                  onClick={() => void moderate(post, 'delete')}
                  className="rounded-full bg-[var(--color-error-bg)] px-4 py-1.5 text-xs font-bold text-[var(--color-error)] transition-colors hover:opacity-80 disabled:opacity-50"
                >
                  حذف نهائي
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}