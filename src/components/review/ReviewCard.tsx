import type { Review, VoteType } from '@/types';
import { RATING_LABELS } from '@/types';
import { VoteButtons } from '@/components/review/VoteButtons';

interface ReviewCardProps {
  review: Review;
  buildingId?: string;
  userVote?: VoteType | null;
  onVote?: (reviewId: string, type: VoteType) => Promise<{ ok: boolean; error?: string }>;
  onReport?: () => void;
}

export function ReviewCard({ review, buildingId, userVote = null, onVote, onReport }: ReviewCardProps) {
  const keys = Object.keys(RATING_LABELS) as (keyof typeof RATING_LABELS)[];
  const vals = keys.map((k) => review.ratings[k]).filter((v): v is number => v != null);
  const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : '—';
  const hasAvg = vals.length > 0;

  const details = [
    review.buildingNumber && `عمارة ${review.buildingNumber}`,
    review.floor && `دور ${review.floor}`,
    review.apartmentNumber && `شقة ${review.apartmentNumber}`,
  ].filter(Boolean);

  const dateStr = review.createdAt
    ? new Date(review.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-3xl p-5 shadow-soft hover:shadow-[0_10px_30px_-5px_rgb(15_44_44/0.15)] hover:-translate-y-1 hover:scale-[1.02] transition-all duration-200">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#0F2C2C] flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E9B94A" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text)]">ساكن مجهول</div>
            <div className="text-xs text-[var(--color-text-muted)] truncate">
              {[details.length > 0 ? details.join(' · ') : 'تقييم مجهول', dateStr].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
        {hasAvg && (
          <div className="flex items-center gap-1 bg-[var(--color-accent)]/15 px-2.5 py-1 rounded-lg flex-shrink-0">
            <span className="text-sm font-bold text-[var(--color-primary)]">{avg}</span>
            <span className="text-[var(--color-accent)] text-xs">★</span>
          </div>
        )}
      </div>

      {review.comment && (
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed italic">
          «{review.comment}»
        </p>
      )}

      {buildingId && onVote && (
        <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-[var(--color-border)]">
          <span className="text-xs text-[var(--color-text-muted)]">هل كان مفيداً؟</span>
          <VoteButtons
            reviewId={review.id}
            upvotes={review.upvotes ?? 0}
            downvotes={review.downvotes ?? 0}
            userVote={userVote}
            onVote={onVote}
          />
        </div>
      )}

      {buildingId && onReport && (
        <div className="mt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={onReport}
            className="text-xs text-[var(--color-text-muted)] hover:text-red-500 transition-colors flex items-center gap-1"
          >
            <span>🚩</span>
            إبلاغ
          </button>
          {hasAvg && <span className="text-[10px] text-[var(--color-text-muted)]">{vals.length} معيار</span>}
        </div>
      )}
    </div>
  );
}