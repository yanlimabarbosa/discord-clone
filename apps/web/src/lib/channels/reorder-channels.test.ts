import { describe, it, expect } from 'vitest';
import {
  reorderChannels,
  type ReorderChannel,
} from './reorder-channels';

const channels: ReorderChannel[] = [
  { id: 'a', categoryId: null, position: 0 },
  { id: 'b', categoryId: null, position: 1 },
  { id: 'c', categoryId: null, position: 2 },
];
const cats = [{ id: 'cat1', position: 0 }];

describe('reorderChannels', () => {
  it('moves a channel before another (reorder within uncategorized)', () => {
    const r = reorderChannels(channels, cats, 'c', {
      type: 'channel',
      channelId: 'a',
    });
    expect(r.map((x) => x.id)).toEqual(['c', 'a', 'b']);
    expect(r.map((x) => x.position)).toEqual([0, 1, 2]);
    expect(r.every((x) => x.categoryId === null)).toBe(true);
  });

  it('moves a channel into a category (drop on category header)', () => {
    const r = reorderChannels(channels, cats, 'a', {
      type: 'category',
      categoryId: 'cat1',
    });
    const a = r.find((x) => x.id === 'a');
    expect(a?.categoryId).toBe('cat1');
    // a should come after the uncategorized b, c in global order
    expect(r.map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('assigns contiguous positions across all groups', () => {
    const withCat: ReorderChannel[] = [
      { id: 'a', categoryId: null, position: 0 },
      { id: 'b', categoryId: 'cat1', position: 1 },
    ];
    const r = reorderChannels(withCat, cats, 'a', {
      type: 'category',
      categoryId: 'cat1',
    });
    expect(r.find((x) => x.id === 'b')?.position).toBe(0);
    expect(r.find((x) => x.id === 'a')?.position).toBe(1);
    expect(r.find((x) => x.id === 'a')?.categoryId).toBe('cat1');
  });

  it('returns [] for unknown dragged id', () => {
    expect(
      reorderChannels(channels, cats, 'zzz', {
        type: 'channel',
        channelId: 'a',
      }),
    ).toEqual([]);
  });

  it('handles dropping a channel onto itself (no crash)', () => {
    const r = reorderChannels(channels, cats, 'b', {
      type: 'channel',
      channelId: 'b',
    });
    expect(r.map((x) => x.id).sort()).toEqual(['a', 'b', 'c']);
  });
});
