'use client';

import { useState } from 'react';
import type { VoteType } from '@/types';

interface VoteButtonsProps {
  reviewId: string;
  upvotes: number;
  downvotes: number;
  userVote: VoteType | null;
  onVote: (reviewId: string, type: VoteType) => Promise<{ ok: boolean; error?: string }>;
}

export function VoteButtons({ reviewId, upvotes: initialUp, downvotes: initialDown, userVote: initialVote, onVote }: VoteButtonsProps) {
  const [upvotes, setUpvotes] = useState(initialUp);
  const [downvotes, setDownvotes] = useState(initialDown);
  const [userVote, setUserVote] = useState<VoteType | null>(initialVote);
  const [busy, setBusy] = useState(false);

  const net = upvotes - downvotes;

  const handleVote = async (type: VoteType) => {
    if (busy) return;
    setBusy(true);

    // Optimistic update
    const prevVote = userVote;
    const prevUp = upvotes;
    const prevDown = downvotes;

    if (userVote === type) {
      setUpvotes((u) => u - (type === 'up' ? 1 : 0));
      setDownvotes((d) => d - (type === 'down' ? 1 : 0));
      setUserVote(null);
    } else {
      if (userVote === 'up') setUpvotes((u) => Math.max(0, u - 1));
      if (userVote === 'down') setDownvotes((d) => Math.max(0, d - 1));
      setUpvotes((u) => u + (type === 'up' ? 1 : 0));
      setDownvotes((d) => d + (type === 'down' ? 1 : 0));
      setUserVote(type);
    }

    const res = await onVote(reviewId, type);

    if (!res.ok) {
      // Rollback on failure
      setUpvotes(prevUp);
      setDownvotes(prevDown);
      setUserVote(prevVote);
      if (res.error) window.alert(res.error);
    }

    setBusy(false);
  };

  return (
    <div className="inline-flex items-center gap-1 bg-[var(--color-surface-warm)] border border-[var(--color-border)] rounded-full px-1.5 py-1 select-none">
      <button
        onClick={() => handleVote('up')}
        aria-label="تصويت لأعلى"
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
          userVote === 'up'
            ? 'text-[#6D28D9] bg-[#6D28D9]/10'
            : 'text-[var(--color-text-muted)] hover:text-[#6D28D9] hover:bg-[#6D28D9]/10'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 4l8 9h-5v7h-6v-7H4z" />
        </svg>
      </button>
      <span className={`min-w-[2rem] text-center text-sm font-bold tabular-nums ${net === 0 ? 'text-[var(--color-text-muted)]' : net > 0 ? 'text-[#6D28D9]' : 'text-red-600'}`}>
        {net}
      </span>
      <button
        onClick={() => handleVote('down')}
        aria-label="تصويت لأسفل"
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
          userVote === 'down'
            ? 'text-[#6D28D9] bg-[#6D28D9]/10'
            : 'text-[var(--color-text-muted)] hover:text-[#6D28D9] hover:bg-[#6D28D9]/10'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 20l-8-9h5V4h6v7h5z" />
        </svg>
      </button>
    </div>
  );
}