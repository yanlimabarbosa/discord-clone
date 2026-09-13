import { describe, expect, it } from 'vitest';
import { buildChatItems } from './chat-items';

function msg(
  id: string,
  authorId: string,
  createdAt: string,
  replyTo?: unknown,
) {
  return { id, createdAt, author: { id: authorId }, replyTo };
}

describe('buildChatItems', () => {
  it('marks consecutive same-author messages within 7 minutes as compact', () => {
    const items = buildChatItems([
      msg('1', 'a', '2026-09-13T10:00:00.000Z'),
      msg('2', 'a', '2026-09-13T10:03:00.000Z'),
      msg('3', 'a', '2026-09-13T10:11:00.000Z'),
    ]);
    expect(items.map((i) => i.compact)).toEqual([false, true, false]);
  });

  it('breaks the group when the author changes', () => {
    const items = buildChatItems([
      msg('1', 'a', '2026-09-13T10:00:00.000Z'),
      msg('2', 'b', '2026-09-13T10:01:00.000Z'),
      msg('3', 'b', '2026-09-13T10:02:00.000Z'),
    ]);
    expect(items.map((i) => i.compact)).toEqual([false, false, true]);
  });

  it('never compacts replies', () => {
    const items = buildChatItems([
      msg('1', 'a', '2026-09-13T10:00:00.000Z'),
      msg('2', 'a', '2026-09-13T10:01:00.000Z', { id: '1' }),
    ]);
    expect(items[1].compact).toBe(false);
  });

  it('adds a day label on calendar day changes only', () => {
    const items = buildChatItems([
      msg('1', 'a', '2026-09-12T23:00:00'),
      msg('2', 'a', '2026-09-12T23:04:00'),
      msg('3', 'a', '2026-09-13T00:01:00'),
    ]);
    expect(items[0].dayLabel).not.toBeNull();
    expect(items[1].dayLabel).toBeNull();
    expect(items[2].dayLabel).not.toBeNull();
    expect(items[2].compact).toBe(false);
  });
});
