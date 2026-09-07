import type { VoteType } from '@/types';

export interface VoteUpdateInput {
  existing: VoteType | null;
  requested: VoteType;
  upvotes: number;
  downvotes: number;
}

export interface VoteUpdateResult {
  upvotes: number;
  downvotes: number;
  userVote: VoteType | null;
}

/**
 * Pure toggle logic for a single anonymous user's vote.
 * - Same vote again -> removes it (0 floor, never negative).
 * - Different vote -> switches (removes old, adds new).
 * - No previous vote -> adds the requested one.
 */
export function applyVote({
  existing,
  requested,
  upvotes,
  downvotes,
}: VoteUpdateInput): VoteUpdateResult {
  const up = upvotes;
  const down = downvotes;

  if (existing === requested) {
    return {
      upvotes: requested === 'up' ? Math.max(0, up - 1) : up,
      downvotes: requested === 'down' ? Math.max(0, down - 1) : down,
      userVote: null,
    };
  }

  if (existing === 'up') {
    return { upvotes: Math.max(0, up - 1), downvotes: down + 1, userVote: 'down' };
  }

  if (existing === 'down') {
    return { upvotes: up + 1, downvotes: Math.max(0, down - 1), userVote: 'up' };
  }

  return {
    upvotes: requested === 'up' ? up + 1 : up,
    downvotes: requested === 'down' ? down + 1 : down,
    userVote: requested,
  };
}