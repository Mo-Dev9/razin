'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { arCount, AR_POST_FORMS, AR_COMMENT_FORMS } from '@/lib/format';
import type { PostComment, PostView, ProximityKind } from '@/types';

interface Props {
  neighborhoodId?: string;
  neighborhoodName?: string;
  /** dimmed: مدمج بجانب أرقام الحي. شريط كامل: ترويسة القسم في الرئيسية. */
  variant?: 'inline' | 'full';
}

const BADGE_STYLES: Record<ProximityKind, string> = {
  here: 'bg-[var(--color-success-light)] text-[var(--color-success)]',
  veryClose: 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]',
  close: 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)]',
  far: 'bg-[var(--color-surface-warm)] text-[var(--color-text-muted)]',
  unknown: 'bg-[var(--color-surface-warm)] text-[var(--color-text-muted)]',
};

const SORT_TABS: ReadonlyArray<{ id: 'hot' | 'top'; label: string }> = [
  { id: 'hot', label: 'ساخن' },
  { id: 'top', label: 'الأكثر تصويتًا' },
];

function PinIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

/** الحصول على موقع المتصفح — نص ضمني قدر الإمكان، مع أقصى مهلة. */
function getCurrentPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(null);
      return;
    }
    const timeout = setTimeout(() => resolve(null), 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60_000 }
    );
  });
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' });
}

export function CommunityFeed({ neighborhoodId, neighborhoodName, variant = 'inline' }: Props) {
  const { user, loading: authLoading, isLinkedWithGoogle, signInWithGoogle } = useAuth();
  const [posts, setPosts] = useState<PostView[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);

  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [locTried, setLocTried] = useState(false);
  const [sort, setSort] = useState<'hot' | 'top'>('hot');

  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState(false);

  const [openThreads, setOpenThreads] = useState<Set<string>>(new Set());
  const [commentsByPost, setCommentsByPost] = useState<Record<string, PostComment[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<string | null>(null);
  const [commentsHasMore, setCommentsHasMore] = useState<Record<string, boolean>>({});
  const [commentsLoadingMore, setCommentsLoadingMore] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [votingId, setVotingId] = useState<string | null>(null);
  const [reportOpen, setReportOpen] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reportBusy, setReportBusy] = useState(false);
  const [reportedPosts, setReportedPosts] = useState<Set<string>>(new Set());
  const [reportError, setReportError] = useState<string | null>(null);

  // منشورات إرشادية قابلة للإخفاء (localStorage لكل جهاز) — «البذور» تظهر في
  // أي موقع بلا استثناء لكن المستخدم حر في تجاوزها بضغطة (قرار ٤).
  const [dismissedGuides, setDismissedGuides] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem('harah_dismissed_guides');
      const arr: unknown = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr.filter((x): x is string => typeof x === 'string') : []);
    } catch {
      return new Set();
    }
  });

  const fetchedRef = useRef(false);

  const query = useCallback(() => {
    const params = new URLSearchParams();
    params.set('sort', sort);
    if (loc) {
      params.set('lat', String(loc.lat));
      params.set('lng', String(loc.lng));
    } else if (neighborhoodId) {
      params.set('neighborhoodId', neighborhoodId);
    }
    return params;
  }, [loc, neighborhoodId, sort]);

  const loadFeed = useCallback(
    async (offset: number) => {
      setFeedError(null);
      if (offset === 0) setFeedLoading(true);
      try {
        const params = query();
        const headers: Record<string, string> = {};
        if (user && !authLoading) {
          try {
            headers.Authorization = `Bearer ${await user.getIdToken()}`;
          } catch {
            // متصفح بلا جلسة — قراءة عامة
          }
        }
        const res = await fetch(`/api/posts?${params.toString()}`, { headers });
        if (!res.ok) throw new Error('load');
        const data = (await res.json()) as {
          posts?: PostView[];
          hasMore?: boolean;
          nextOffset?: number;
        };
        const incoming = data.posts ?? [];
        setPosts((prev) => (offset === 0 ? incoming : [...prev, ...incoming]));
        setHasMore(data.hasMore ?? false);
        setNextOffset(data.nextOffset ?? offset);
      } catch {
        setFeedError('تعذر تحميل منشورات الحارة — حاول لاحقًا');
      } finally {
        setFeedLoading(false);
      }
    },
    [query, user, authLoading]
  );

  // التحميل الأولي + إعادة عند تغيّر الموقع/الفرز
  useEffect(() => {
    if (authLoading) return;
    // L3: القراءة عامة بلا هوية — لا نعلّق الخلاصة لو تعذّر إعداد المجهول
    // (فشل transient معاد بثلاث محاولات في useAuth). نحمّل بمجرد استقرار auth.
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    void loadFeed(0);
    // عند تغيّر الفرز أو الموقع بعد التحميل الأول — يعاد التحميل من الصفر
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loc?.lat, loc?.lng, sort, authLoading]);

  const activateLocation = useCallback(async () => {
    if (locTried) return;
    setLocTried(true);
    const pos = await getCurrentPosition();
    if (pos) setLoc(pos);
    // بلا موقع — تبقى الخلاصة حسب الحي إن وُجد أو تُفرَّغ
    void loadFeed(0);
  }, [locTried, loadFeed]);

  async function submitPost() {
    const body = text.trim();
    if (body.length < 2 || submitting || authLoading || !user) {
      if (!user) setPostError('حدث خطأ أثناء إعداد الحساب — أعد المحاولة');
      else if (body.length < 2) setPostError('المنشور يجب ألا يقل عن حرفين');
      return;
    }
    if (!loc) {
      setPostError('النشر يتطلب تفعيل موقعك — فعّله أولًا');
      return;
    }
    setSubmitting(true);
    setPostError(null);
    setPostSuccess(false);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          text: body,
          lat: loc.lat,
          lng: loc.lng,
        }),
      });
      const data = (await res.json()) as { post?: PostView; error?: string };
      if (!res.ok) {
        setPostError(data.error || 'تعذر إرسال المنشور');
        return;
      }
      if (data.post) {
        setPosts((prev) => [data.post as PostView, ...prev]);
        setHasMore(true);
      }
      setText('');
      setPostSuccess(true);
    } catch {
      setPostError('تعذر الإرسال — تحقق من اتصالك');
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(post: PostView, voteValue: -1 | 1) {
    if (votingId) return;
    if (!user) {
      setPostError('حدث خطأ أثناء إعداد الحساب — أعد المحاولة');
      return;
    }
    setVotingId(post.id);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/posts/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ postId: post.id, vote: post.myVote === voteValue ? 0 : voteValue }),
      });
      const data = (await res.json()) as { upCount?: number; downCount?: number; netVotes?: number; myVote?: number; error?: string };
      if (!res.ok) {
        setPostError(data.error || 'تعذر تسجيل التصويت');
        return;
      }
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                upCount: data.upCount ?? p.upCount,
                downCount: data.downCount ?? p.downCount,
                netVotes: data.netVotes ?? p.netVotes,
                myVote: (data.myVote as -1 | 0 | 1) ?? 0,
              }
            : p
        )
      );
    } catch {
      setPostError('تعذر تسجيل التصويت — تحقق من اتصالك');
    } finally {
      setVotingId(null);
    }
  }

  async function toggleComments(post: PostView) {
    const open = openThreads.has(post.id);
    const next = new Set(openThreads);
    if (open) {
      next.delete(post.id);
      setOpenThreads(next);
      return;
    }
    next.add(post.id);
    setOpenThreads(next);
    if (commentsByPost[post.id]) return;
    setCommentsLoading(post.id);
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`);
      if (!res.ok) throw new Error('load');
      const data = (await res.json()) as { comments?: PostComment[]; hasMore?: boolean };
      setCommentsByPost((prev) => ({ ...prev, [post.id]: data.comments ?? [] }));
      setCommentsHasMore((prev) => ({ ...prev, [post.id]: data.hasMore === true }));
    } catch {
      setCommentsByPost((prev) => ({ ...prev, [post.id]: null as unknown as PostComment[] }));
    } finally {
      setCommentsLoading(null);
    }
  }

  async function loadMoreComments(post: PostView) {
    if (!commentsByPost[post.id] || commentsLoadingMore[post.id]) return;
    setCommentsLoadingMore((prev) => ({ ...prev, [post.id]: true }));
    try {
      const res = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments?limit=50&offset=${commentsByPost[post.id].length}`);
      if (!res.ok) throw new Error('load');
      const data = (await res.json()) as { comments?: PostComment[]; hasMore?: boolean };
      setCommentsByPost((prev) => ({ ...prev, [post.id]: [...(prev[post.id] ?? []), ...(data.comments ?? [])] }));
      setCommentsHasMore((prev) => ({ ...prev, [post.id]: data.hasMore === true }));
    } catch {
      setCommentsHasMore((prev) => ({ ...prev, [post.id]: false }));
    } finally {
      setCommentsLoadingMore((prev) => ({ ...prev, [post.id]: false }));
    }
  }

  async function submitComment(post: PostView) {
    const body = (commentText[post.id] ?? '').trim();
    if (body.length < 2 || !user) return;
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/posts/${encodeURIComponent(post.id)}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ text: body }),
      });
      const data = (await res.json()) as { comment?: PostComment; error?: string };
      if (!res.ok) {
        setPostError(data.error || 'تعذر إرسال التعليق');
        return;
      }
      if (data.comment) {
        setCommentsByPost((prev) => ({ ...prev, [post.id]: [...(prev[post.id] ?? []), data.comment as PostComment] }));
        setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, numComments: p.numComments + 1 } : p)));
      }
      setCommentText((prev) => ({ ...prev, [post.id]: '' }));
    } catch {
      setPostError('تعذر إرسال التعليق');
    }
  }

  async function submitReport(post: PostView) {
    if (reportBusy || authLoading || !user) return;
    setReportBusy(true);
    setReportError(null);

    // الإبلاغ يتطلب هوية جوجل (قرار ٥) — إن لم يكُن الحساب مرتبطًا نجعل الربط
    // جزءًا من تدفق الإبلاغ ذاته (لا نُرسل الرمز المجهول الذي يُرفض سيرفر-سايد).
    let activeUser = user;
    if (user && !isLinkedWithGoogle) {
      const linked = await signInWithGoogle();
      if (!linked.success) {
        setReportError('الإبلاغ يتطلب تسجيل الدخول بحساب جوجل — أعد المحاولة واربط حسابك أولًا');
        setReportBusy(false);
        return;
      }
      activeUser = linked.user ?? getFirebaseAuth().currentUser ?? user;
    }

    try {
      const idToken = await activeUser.getIdToken(true);
      const res = await fetch(`/api/posts/${encodeURIComponent(post.id)}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ text: reportReason.trim() }),
      });
      const data = (await res.json()) as { hidden?: boolean; error?: string };
      if (res.ok) {
        if (data.hidden) {
          // عتبة بلاغين من حسابين مختلفين: أُخفيت فورًا — بطاقة شكر مكان المنشور
          const next = new Set(reportedPosts);
          next.add(post.id);
          setReportedPosts(next);
        } else {
          // بلاغ أول: أُرسل للأدمن لكن المنشور يبقى ظاهرًا (حماية ٨ + عتبة الحسابين).
        }
        setReportOpen(null);
        setReportReason('');
        setReportError(null);
      } else {
        setReportError(data.error || 'تعذر الإبلاغ');
      }
    } catch {
      setReportError('تعذر الإبلاغ — تحقق من اتصالك');
    } finally {
      setReportBusy(false);
    }
  }

  function dismissGuide(id: string) {
    setDismissedGuides((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('harah_dismissed_guides', JSON.stringify([...next]));
      } catch {
        // تخزين غير متاح — الإخفاء يبقى للجلسة
      }
      return next;
    });
  }

  const emptyLabel =
    loc === null && neighborhoodId
      ? `لا مشاركات في ${neighborhoodName ?? 'هذا الحي'} بعد — كن أول من يكتب.`
      : loc === null
        ? 'فعّل موقعك لترى منشورات جيرانك في مدى 10 كم — أو تصفح حيًا وافتح حارته من صفحته.'
        : 'لا مشاركات قريبة منك بعد — كن أول من يكتب عن حيّك.';

  // النشر يتطلب موقعًا إجباريًا دائمًا (UI + خادم) — بلا موقع يمكنك القراءة فقط.
  const requireLoc = loc === null;

  return (
    <section
      className={
        variant === 'full'
          ? 'mx-auto max-w-3xl px-4 py-10'
          : 'rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-soft lg:col-span-2'
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className={variant === 'full' ? 'text-2xl font-extrabold text-[var(--color-text)] md:text-3xl' : 'text-lg font-extrabold text-[var(--color-text)]'}>
            حارة
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {variant === 'full'
              ? 'مجتمع حيّك المجهول — اسأل، شارك، وحذّر. لا أسماء حقيقية ولا مواقع دقيقة.'
              : `أهل ${neighborhoodName ?? 'الحارة'} يسألون ويجيبون — بلا أسماء، وبجانب كل مشاركة مدى القرب منك فقط.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {variant === 'full' && (
            <button
              type="button"
              onClick={() => {
                if (loc === null) {
                  void activateLocation();
                } else {
                  document.getElementById('post-input')?.focus();
                }
              }}
              className="rounded-full bg-[var(--color-accent)] px-4 py-1.5 text-xs font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-accent-dark)]"
            >
              اسأل أهل الحي
            </button>
          )}
          <span className="shrink-0 rounded-full bg-[var(--color-surface-warm)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)]">
            {arCount(posts.filter((p) => !p.isGuide).length, AR_POST_FORMS)}
          </span>
        </div>
      </div>

      {/* تسميات القرب — شرح نصي فقط */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
        <span className="rounded-full bg-[var(--color-success-light)] px-3 py-1 font-bold text-[var(--color-success)]">هنا ≤1 كم</span>
        <span className="rounded-full bg-[var(--color-accent)]/15 px-3 py-1 font-bold text-[var(--color-accent)]">قريب جدًا ≤2 كم</span>
        <span className="rounded-full bg-[var(--color-surface-warm)] px-3 py-1 font-bold text-[var(--color-text-secondary)]">قريب ≤10 كم</span>
      </div>

      {/* تفعيل الموقع */}
      {loc === null && !locTried && (
        <button
          type="button"
          onClick={() => void activateLocation()}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[var(--color-accent-dark)] bg-[var(--color-accent)]/10 px-4 py-3 text-sm font-bold text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20"
        >
          <PinIcon className="h-4 w-4" />
          {neighborhoodId ? 'فعّل موقعك لنرى القريب منك' : 'فعّل موقعك لترى حارتك حولك'}
        </button>
      )}
      {loc === null && locTried && (
        <p className="mt-3 rounded-2xl bg-[var(--color-surface-warm)] px-4 py-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          {neighborhoodId
            ? 'تركت الموقع معطّلًا — تعرض مشاركات هذا الحي فقط، بلا تسمية قرب.'
            : 'تركت الموقع معطّلًا — فعّل طلب الموقع أو ابحث عن حي من صفحته وافتح حارته.'}
        </p>
      )}

      {/* زر/مربع المشاركة — ظاهر دائمًا (بعلامة تفعيل الموقع عند اللزوم بدل الاختفاء) */}
      {requireLoc ? (
        <div className="mt-4 rounded-2xl border border-dashed border-[var(--color-accent-dark)] bg-[var(--color-accent)]/5 p-5 text-center">
          <p className="text-sm font-extrabold text-[var(--color-text)]">اكتب مشاركة جديدة في حارتك</p>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[var(--color-text-secondary)]">
            النشر يتطلب تفعيل موقعك — موقعك لا يُعرض لأحد ويُقرَّب (~150م) قبل التخزين. بدونه تقرأ وتصوّت فقط.
          </p>
          <button
            type="button"
            onClick={() => void activateLocation()}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent)] px-6 py-2.5 text-sm font-bold text-[var(--color-primary-dark)] transition-all hover:bg-[var(--color-accent-dark)]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>
            {locTried ? 'أعد محاولة تفعيل الموقع' : 'فعّل موقعك وابدأ الكتابة'}
          </button>
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-warm)] p-4">
        <label htmlFor="post-input" className="text-xs font-bold text-[var(--color-text-secondary)]">
          اكتب عن حيّك…
        </label>
        <textarea
          id="post-input"
          value={text}
          maxLength={500}
          rows={3}
          onChange={(e) => setText(e.target.value)}
          placeholder={neighborhoodId ? `مثال: التيار الكهربائي بيفصل في ${neighborhoodName ?? 'الحي'} الصيف ده؟` : 'مثال: نصيحة عن مالك عمارة، سؤال عن منطقة، خدمة تقدمها لأهل حيّك…'}
          className="mt-2 w-full resize-none rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--color-text-muted)]">{text.length}/500</span>
          <button
            type="button"
            onClick={() => void submitPost()}
            disabled={submitting || authLoading || text.trim().length < 2}
            className="rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-sm font-bold text-[var(--color-primary-dark)] transition-all hover:bg-[var(--color-accent-dark)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? 'جارٍ الإرسال…' : 'انشر'}
          </button>
        </div>
        {postError && <p className="mt-2 text-xs font-bold text-[var(--color-error)]">{postError}</p>}
        {postSuccess && (
          <p className="mt-2 text-xs font-bold text-[var(--color-success)]">نُشر منشورك — شكرًا لمساهمتك.</p>
        )}

        {/* ربط اختياري بجوجل: النشر يبقى مجهولًا، والربط يتيح رؤية منشوراتك عبر
            الأجهزة (الملف الشخصي /api/posts/mine مربوط بحسابك لا بجهازك). */}
        {user?.isAnonymous && !isLinkedWithGoogle && (
          <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl bg-[var(--color-accent)]/10 px-3 py-2">
            <p className="text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
              نشرك مجهول دائمًا — ويمكنك ربط حساب جوجل (اختياري) لرؤية منشوراتك على أي جهاز من صفحة «ملفي».
            </p>
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="rounded-full bg-[var(--color-accent)] px-3 py-1 text-[11px] font-bold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-accent-dark)]"
            >
              ربط حسابي
            </button>
          </div>
        )}
      </div>
      )}

      {/* الفرز */}
      <div className="mt-4 flex items-center gap-2">
        {SORT_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSort(t.id)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              sort === t.id
                ? 'bg-[var(--color-accent)]/15 text-[var(--color-accent)]'
                : 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* القائمة */}
      <div className="mt-4">
        {feedLoading && (
          <div className="py-8 text-center text-sm text-[var(--color-text-secondary)]">جارٍ تحميل منشورات الحارة…</div>
        )}
        {!feedLoading && feedError && (
          <div className="rounded-2xl bg-[var(--color-error-bg)] px-4 py-6 text-center text-sm font-bold text-[var(--color-error)]">
            {feedError}
          </div>
        )}
        {!feedLoading && !feedError && posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-8 text-center text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {emptyLabel}
          </div>
        )}

        {posts.map((post) => {
          if (post.isGuide && dismissedGuides.has(post.id)) return null;
          if (reportedPosts.has(post.id)) {
            return (
              <div key={post.id} className="border-b border-[var(--color-border-light)] py-5 last:border-b-0">
                <div className="rounded-2xl bg-[var(--color-success-light)]/60 px-4 py-5 text-center">
                  <p className="text-sm font-extrabold text-[var(--color-success)]">شكرًا على بلاغك</p>
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                    استلمنا بلاغك — أُخفيت المشاركة من العرض فورًا، وسيراجعها فريق رزين ويقرر قراره بأسرع وقت.
                  </p>
                </div>
              </div>
            );
          }
          const threadOpen = openThreads.has(post.id);
          const comments = commentsByPost[post.id];
          const myComment = commentText[post.id] ?? '';
          return (
            <article key={post.id} className="border-b border-[var(--color-border-light)] py-4 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-extrabold text-[var(--color-text)]">{post.displayName}</span>
                  {post.isGuide && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-accent)]/15 px-3 py-1 text-[11px] font-bold text-[var(--color-accent)]">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3" aria-hidden>
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 16v-4M12 8h.01" />
                      </svg>
                      إرشاد من فريق رزين
                    </span>
                  )}
                  {!post.isGuide && post.badgeLabel && (
                    <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${BADGE_STYLES[post.kind]}`}>
                      <PinIcon className="h-3 w-3" />
                      {post.badgeLabel}
                    </span>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[11px] text-[var(--color-text-muted)]">{formatDate(post.createdAt)}</span>
                  {post.isGuide && (
                    <button
                      type="button"
                      onClick={() => dismissGuide(post.id)}
                      className="rounded-full bg-[var(--color-surface-warm)] px-2 py-0.5 text-[10px] font-bold text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-error)]"
                      aria-label="إخفاء الإرشاد"
                    >
                      إخفاء ×
                    </button>
                  )}
                </div>
              </div>

              <p className="mt-1.5 text-sm leading-relaxed text-[var(--color-text)]">{post.text}</p>

              {/* التصويت + التعليق + الإبلاغ */}
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => void vote(post, 1)}
                  disabled={votingId === post.id || !user}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    post.myVote === 1
                      ? 'bg-[var(--color-success-light)] text-[var(--color-success)]'
                      : 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                  }`}
                  aria-label="تصويت لأعلى"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="m18 15-6-6-6 6" /></svg>
                  {post.upCount}
                </button>
                <button
                  type="button"
                  onClick={() => void vote(post, -1)}
                  disabled={votingId === post.id || !user}
                  className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                    post.myVote === -1
                      ? 'bg-[var(--color-error)]/15 text-[var(--color-error)]'
                      : 'bg-[var(--color-surface-warm)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
                  }`}
                  aria-label="تصويت لأسفل"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5"><path d="m6 9 6 6 6-6" /></svg>
                  {post.downCount}
                </button>
                <span className="mx-1 text-xs font-bold text-[var(--color-text-muted)]">{post.netVotes > 0 ? `+${post.netVotes}` : post.netVotes}</span>

                <button
                  type="button"
                  onClick={() => void toggleComments(post)}
                  className="rounded-full bg-[var(--color-surface-warm)] px-3 py-1 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
                >
                  {post.numComments > 0 ? arCount(post.numComments, AR_COMMENT_FORMS) : 'علّق'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setReportOpen(reportOpen === post.id ? null : post.id);
                    setReportReason('');
                    setReportError(null);
                  }}
                  className="mr-auto rounded-full px-3 py-1 text-[11px] font-bold text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
                >
                  بلّغ
                </button>
              </div>

              {/* الإبلاغ */}
              {reportOpen === post.id && (
                <div className="mt-3 rounded-2xl bg-[var(--color-error-bg)]/50 p-3">
                  {!isLinkedWithGoogle && !user?.isAnonymous ? (
                    <p className="text-xs font-bold text-[var(--color-error)]">
                      الإبلاغ يتطلب تسجيل الدخول بحساب جوجل — بلاغان من حسابين مختلفين يُخفيان المشاركة فورًا.
                    </p>
                  ) : user?.isAnonymous ? (
                    <p className="text-xs font-bold text-[var(--color-error)]">
                      الإبلاغ يتطلب تسجيل الدخول بحساب جوجل — اضغط «تأكيد الإبلاغ» وسيفتح لك نافذة الربط، وبلاغان من حسابين مختلفين يُخفيان المشاركة.
                    </p>
                  ) : (
                    <p className="text-xs font-bold text-[var(--color-error)]">
                      بلاغ أول يُحال للفريق والمنشور يبقى ظاهرًا؛ بلاغان من حسابين مختلفين يُخفيان المشاركة فورًا حتى يراجعها الأدمن.
                    </p>
                  )}
                  {reportError && <p className="mt-2 text-xs font-bold text-[var(--color-error)]">{reportError}</p>}
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      maxLength={200}
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      placeholder="سبب الإبلاغ (اختياري)"
                      className="w-full flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[var(--color-error)]"
                    />
                    <button
                      type="button"
                      onClick={() => void submitReport(post)}
                      disabled={reportBusy}
                      className="rounded-xl bg-[var(--color-error)] px-4 py-2 text-xs font-bold text-white transition-colors hover:opacity-90 disabled:opacity-50"
                    >
                      {reportBusy ? 'جارٍ…' : 'تأكيد الإبلاغ'}
                    </button>
                  </div>
                </div>
              )}

              {/* التعليقات */}
              {threadOpen && (
                <div className="mt-3 rounded-2xl bg-[var(--color-surface-warm)] p-3">
                  {commentsLoading === post.id && (
                    <div className="py-3 text-center text-xs text-[var(--color-text-secondary)]">جارٍ تحميل التعليقات…</div>
                  )}
                  {commentsLoading !== post.id && comments && (
                    <>
                      {comments.length === 0 && (
                        <p className="py-2 text-center text-xs text-[var(--color-text-muted)]">لا تعليقات بعد — كن أول من يرد.</p>
                      )}
                      {comments.map((c) => (
                        <div key={c.id} className="border-b border-[var(--color-border-light)] py-2 last:border-b-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-[var(--color-text)]">{c.displayName}</span>
                            <span className="text-[10px] text-[var(--color-text-muted)]">{formatDate(c.createdAt)}</span>
                          </div>
                          <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text)]">{c.text}</p>
                        </div>
                      ))}
                      {comments.length > 0 && commentsHasMore[post.id] && (
                        <button
                          type="button"
                          onClick={() => void loadMoreComments(post)}
                          disabled={!!commentsLoadingMore[post.id]}
                          className="mt-2 w-full rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-50"
                        >
                          {commentsLoadingMore[post.id] ? 'جارٍ تحميل المزيد…' : 'عرض المزيد من التعليقات'}
                        </button>
                      )}
                    </>
                  )}
                  {commentsLoading !== post.id && (
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                      <input
                        type="text"
                        maxLength={300}
                        value={myComment}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        placeholder="اكتب تعليقًا…"
                        className="w-full flex-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
                      />
                      <button
                        type="button"
                        onClick={() => void submitComment(post)}
                        disabled={myComment.trim().length < 2 || !user}
                        className="rounded-xl bg-[var(--color-accent)] px-4 py-2 text-xs font-bold text-[var(--color-primary-dark)] transition-colors hover:bg-[var(--color-accent-dark)] disabled:opacity-40"
                      >
                        رد
                      </button>
                    </div>
                  )}
                </div>
              )}
            </article>
          );
        })}

        {!feedLoading && hasMore && (
          <button
            type="button"
            onClick={() => void loadFeed(nextOffset)}
            className="mt-4 w-full rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-warm)] px-4 py-3 text-sm font-bold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
          >
            عرض المزيد
          </button>
        )}
      </div>
    </section>
  );
}