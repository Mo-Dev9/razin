import { describe, it, expect } from 'vitest';
import { applyVote } from '@/lib/vote-logic';

describe('applyVote — single anonymous user toggle logic', () => {
  it('adds an upvote when no previous vote', () => {
    expect(applyVote({ existing: null, requested: 'up', upvotes: 0, downvotes: 0 })).toEqual({
      upvotes: 1,
      downvotes: 0,
      userVote: 'up',
    });
  });

  it('adds a downvote when no previous vote', () => {
    expect(applyVote({ existing: null, requested: 'down', upvotes: 2, downvotes: 3 })).toEqual({
      upvotes: 2,
      downvotes: 4,
      userVote: 'down',
    });
  });

  it('removes the vote when clicking the same type again', () => {
    const result = applyVote({ existing: 'up', requested: 'up', upvotes: 5, downvotes: 2 });
    expect(result).toEqual({ upvotes: 4, downvotes: 2, userVote: null });

    const down = applyVote({ existing: 'down', requested: 'down', upvotes: 0, downvotes: 1 });
    expect(down).toEqual({ upvotes: 0, downvotes: 0, userVote: null });
  });

  it('switches from up to down', () => {
    expect(applyVote({ existing: 'up', requested: 'down', upvotes: 5, downvotes: 2 })).toEqual({
      upvotes: 4,
      downvotes: 3,
      userVote: 'down',
    });
  });

  it('switches from down to up', () => {
    expect(applyVote({ existing: 'down', requested: 'up', upvotes: 2, downvotes: 5 })).toEqual({
      upvotes: 3,
      downvotes: 4,
      userVote: 'up',
    });
  });

  it('never lets counts go negative', () => {
    expect(applyVote({ existing: 'up', requested: 'up', upvotes: 0, downvotes: 0 })).toEqual({
      upvotes: 0,
      downvotes: 0,
      userVote: null,
    });
    expect(applyVote({ existing: 'down', requested: 'down', upvotes: 0, downvotes: 0 })).toEqual({
      upvotes: 0,
      downvotes: 0,
      userVote: null,
    });
    expect(applyVote({ existing: 'down', requested: 'up', upvotes: 0, downvotes: 0 })).toEqual({
      upvotes: 1,
      downvotes: 0,
      userVote: 'up',
    });
  });

  it('keeps other-direction count intact when removing', () => {
    expect(applyVote({ existing: 'up', requested: 'up', upvotes: 1, downvotes: 7 })).toEqual({
      upvotes: 0,
      downvotes: 7,
      userVote: null,
    });
  });
});