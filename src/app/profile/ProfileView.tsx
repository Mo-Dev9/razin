'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { placeByNeighborhoodId } from '@/lib/neighborhood-search';
import { formatDate } from '@/lib/utils';
import { arCount, AR_COMMENT_FORMS } from '@/lib/format';

interface MinePost {
  id: string;
  text: string;
  createdAt: number;
  upCount: number;
  downCount: number;
  netVotes: number;
  numComments: number;
  status: 'open' | 'hidden';
  neighborhoodId: string | null;
  city: string | null;
}

const EMPTY: MinePost[] = [];

/**
 * «ملفي» — صفحة الهوية المجهولة في رزين: لا صورة ولا اسم حقيقي ولا تخصيص
 * (قرار ٥). تعرض الاسم المستعار الثابت للجهاز + منشورات المستخدم في «حارة».
 */
export function ProfileView() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<MinePost[]>(EMPTY);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = useState('');
  const fetchedRef = useRef(false);

  const loadMine = useCallback(async () => {
    try {
      const idToken = await user!.getIdToken();
      const res = await fetch('/api/posts/mine?limit=50', {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      const data = (await res.json()) as { posts?: MinePost[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'load');
      setPosts(data.posts ?? []);
      setLoadState('ready');
    } catch (err) {
      setError(err instanceof Error && err.message !== 'load' ? err.message : 'تعذر تحميل منشوراتك — حاول لاحقًا');
      setLoadState('error');
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!fetchedRef.current && !user) return;
    fetchedRef.current = true;
    void loadMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user]);

  // الاسم المستعار يُشتق دائمًا من uid — لا نعرض profile.displayName أبدًا
  // (رفضٌ صريح لأي اسم حقيقي قد يكون خُزّن سابقًا قبل قرار «بلا اسمك الحقيقي»).
  const displayName = user ? formatName(user.uid) : '';

  return (
    <div className="space-y-6">
      {/* بطاقة الهوية المجهولة */}
      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-surface-warm)] text-xl font-extrabold text-[var(--color-primary)]">
              {user ? '؟' : '—'}
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">أنت في «حارة»</p>
              <h1 className="text-2xl font-extrabold text-[var(--color-primary)]" dir="ltr">
                {displayName || '…'}
              </h1>
            </div>
          </div>
          <span className="rounded-full bg-[var(--color-success-light)] px-3 py-1 text-xs font-bold text-[var(--color-success)]">
            هوية مجهولة
          </span>
        </div>

        <p className="mt-5 rounded-2xl bg-[var(--color-surface-warm)] px-4 py-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          هذا اسمك الافتراضي في رزين — ثابت لجهازك هذا فقط، بلا اسمك الحقيقي وبلا
          صورة وبلا تخصيص. لا يمكن لأي مستخدم آخر رؤيته أو الوصول لهويتك أو موقعك
          الدقيق (يُقرَّب ~150م عند النشر ولا يُسلَّم للواجهة أبدًا).
        </p>

        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex-1 rounded-2xl bg-[var(--color-surface-warm)] p-4 text-center">
            <p className="text-2xl font-extrabold text-[var(--color-primary)]">{loadState === 'ready' ? posts.length : '—'}</p>
            <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">منشوراتي في «حارة»</p>
          </div>
        </div>
      </section>

      {/* منشوراتي */}
      <section className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-soft">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-extrabold text-[var(--color-primary)]">منشوراتي</h2>
          <Link
            href="/hara"
            className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-xs font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-accent-dark)]"
          >
            اكتب في حارتك
          </Link>
        </div>

        {authLoading && (
          <div className="mt-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">جارٍ تحميل هويتك…</div>
        )}

        {!authLoading && !user && (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">
            لا يمكن تحديد هويتك بعد — حدّث الصفحة لإعداد حسابك المجهول تلقائيًا.
          </div>
        )}

        {!authLoading && user && loadState === 'loading' && (
          <div className="mt-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">جارٍ تحميل منشوراتك…</div>
        )}

        {loadState === 'error' && (
          <div className="mt-4 rounded-2xl bg-[var(--color-error-bg)] px-4 py-6 text-center text-sm font-bold text-[var(--color-error)]">
            {error}
          </div>
        )}

        {!authLoading && user && loadState === 'ready' && posts.length === 0 && (
          <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-8 text-center text-sm leading-relaxed text-[var(--color-text-secondary)]">
            لم تنشر شيئًا بعد — شارك تجربة أو اسأل أهل حيّك في «حارة».
          </div>
        )}

        {loadState === 'ready' && posts.length > 0 && (
          <ul className="mt-4 space-y-3">
            {posts.map((p) => {
              const place = p.neighborhoodId ? placeByNeighborhoodId(p.neighborhoodId) : null;
              const placeLabel = place ? `${place.name} · ${place.governorate}` : p.city ?? null;
              return (
                <li
                  key={p.id}
                  className="rounded-2xl border border-[var(--color-border-light)] bg-[var(--color-surface-warm)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-text-muted)]">
                      {placeLabel && <span>{placeLabel}</span>}
                      <span>{formatDate(p.createdAt)}</span>
                      {p.status === 'hidden' && (
                        <span className="rounded-full bg-[var(--color-error)]/10 px-2 py-0.5 font-bold text-[var(--color-error)]">
                          مخفي للمراجعة
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 text-xs font-bold text-[var(--color-text-secondary)]">
                      {p.netVotes > 0 ? `+${p.netVotes}` : p.netVotes} · {arCount(p.numComments, AR_COMMENT_FORMS)}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text)]">{p.text}</p>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        صفحة الملف الشخصي لا تطلب تسجيلًا — هويتك تُنشأ تلقائيًا لمتصفحك هذا فقط.
      </p>
    </div>
  );
}

function formatName(uid: string): string {
  const suffix = uid.slice(0, 4).toLowerCase();
  return `مستخدم_${suffix}`;
}