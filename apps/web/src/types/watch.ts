export type WatchVideo = { id: string; title: string };

export type WatchSearchResult = {
  id: string;
  title: string;
  channel: string;
  thumb: string;
};

export type WatchState = {
  queue: WatchVideo[];
  currentIndex: number;
  playing: boolean;
  positionSec: number;
  updatedAtMs: number;
};

export const EMPTY_WATCH: WatchState = {
  queue: [],
  currentIndex: -1,
  playing: false,
  positionSec: 0,
  updatedAtMs: 0,
};
