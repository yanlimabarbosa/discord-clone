import { describe, it, expect } from 'vitest';
import { applyActivity, isMention, type ActivityEvent } from './apply-activity';
import type { UnreadMap } from '../../types/unread';

const base: ActivityEvent = {
  channelId: 'c1',
  serverId: 's1',
  authorId: 'other',
  mentionsEveryone: false,
  mentionedUserIds: [],
};

describe('isMention', () => {
  it('is true for @everyone', () => {
    expect(isMention({ ...base, mentionsEveryone: true }, 'me')).toBe(true);
  });

  it('is true when I am in mentionedUserIds', () => {
    expect(isMention({ ...base, mentionedUserIds: ['me'] }, 'me')).toBe(true);
  });

  it('is false when I am not mentioned', () => {
    expect(isMention({ ...base, mentionedUserIds: ['x'] }, 'me')).toBe(false);
  });

  it('is false with no user id', () => {
    expect(isMention({ ...base, mentionedUserIds: ['me'] }, undefined)).toBe(
      false,
    );
  });
});

describe('applyActivity', () => {
  it('marks a channel unread', () => {
    const next = applyActivity({}, base, 'me', null);
    expect(next.s1.c1).toEqual({ unread: true, mentions: 0 });
  });

  it('increments mentions when mentioned', () => {
    const e = { ...base, mentionedUserIds: ['me'] };
    let map: UnreadMap = {};
    map = applyActivity(map, e, 'me', null);
    map = applyActivity(map, e, 'me', null);
    expect(map.s1.c1).toEqual({ unread: true, mentions: 2 });
  });

  it('ignores my own messages', () => {
    const next = applyActivity({}, { ...base, authorId: 'me' }, 'me', null);
    expect(next).toEqual({});
  });

  it('ignores the channel I am currently viewing', () => {
    const next = applyActivity({}, base, 'me', 'c1');
    expect(next).toEqual({});
  });

  it('does not mutate the input map', () => {
    const map: UnreadMap = {};
    applyActivity(map, base, 'me', null);
    expect(map).toEqual({});
  });

  it('keeps other channels intact', () => {
    const start: UnreadMap = { s1: { c9: { unread: true, mentions: 1 } } };
    const next = applyActivity(start, base, 'me', null);
    expect(next.s1.c9).toEqual({ unread: true, mentions: 1 });
    expect(next.s1.c1).toEqual({ unread: true, mentions: 0 });
  });
});
