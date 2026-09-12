import { describe, it, expect } from 'vitest';
import { serverBadge } from './server-badge';

describe('serverBadge', () => {
  it('returns empty for undefined', () => {
    expect(serverBadge(undefined)).toEqual({ hasUnread: false, mentions: 0 });
  });

  it('aggregates unread across channels', () => {
    const badge = serverBadge({
      c1: { unread: true, mentions: 0 },
      c2: { unread: false, mentions: 0 },
    });
    expect(badge.hasUnread).toBe(true);
    expect(badge.mentions).toBe(0);
  });

  it('sums mentions across channels', () => {
    const badge = serverBadge({
      c1: { unread: true, mentions: 2 },
      c2: { unread: true, mentions: 3 },
    });
    expect(badge.mentions).toBe(5);
  });

  it('reports no unread when all read', () => {
    const badge = serverBadge({
      c1: { unread: false, mentions: 0 },
      c2: { unread: false, mentions: 0 },
    });
    expect(badge).toEqual({ hasUnread: false, mentions: 0 });
  });
});
