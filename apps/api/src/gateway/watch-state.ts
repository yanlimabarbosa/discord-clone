// Server-authoritative "watch together" playback state per channel.
// Pure reducer so it can be unit-tested; the gateway owns the Map + rooms.

export type WatchVideo = { id: string; title: string };

export type WatchState = {
  queue: WatchVideo[];
  currentIndex: number; // -1 = nothing playing
  playing: boolean;
  positionSec: number; // playback position at updatedAtMs
  updatedAtMs: number;
};

export type WatchAction =
  | { type: 'add'; video: WatchVideo }
  | { type: 'playAt'; index: number }
  | { type: 'play' }
  | { type: 'pause' }
  | { type: 'seek'; position: number }
  | { type: 'next' }
  | { type: 'prev' }
  | { type: 'ended' }
  | { type: 'remove'; index: number }
  | { type: 'clear' };

export function emptyWatchState(): WatchState {
  return {
    queue: [],
    currentIndex: -1,
    playing: false,
    positionSec: 0,
    updatedAtMs: 0,
  };
}

// Advance positionSec to `nowMs` if currently playing.
export function liveWatchState(s: WatchState, nowMs: number): WatchState {
  if (!s.playing || s.currentIndex < 0) return { ...s, updatedAtMs: nowMs };
  const elapsed = (nowMs - s.updatedAtMs) / 1000;
  return { ...s, positionSec: s.positionSec + elapsed, updatedAtMs: nowMs };
}

export function applyWatchAction(
  prev: WatchState,
  action: WatchAction,
  nowMs: number,
): WatchState {
  const s = liveWatchState(prev, nowMs);
  const next: WatchState = { ...s, queue: [...s.queue] };

  switch (action.type) {
    case 'add':
      next.queue.push(action.video);
      if (s.currentIndex === -1) {
        next.currentIndex = 0;
        next.playing = true;
        next.positionSec = 0;
      }
      break;
    case 'playAt':
      if (action.index >= 0 && action.index < s.queue.length) {
        next.currentIndex = action.index;
        next.positionSec = 0;
        next.playing = true;
      }
      break;
    case 'play':
      if (s.currentIndex >= 0) next.playing = true;
      break;
    case 'pause':
      next.playing = false;
      break;
    case 'seek':
      next.positionSec = Math.max(0, action.position);
      break;
    case 'next':
    case 'ended':
      if (s.currentIndex < s.queue.length - 1) {
        next.currentIndex = s.currentIndex + 1;
        next.positionSec = 0;
        next.playing = true;
      } else {
        next.playing = false;
      }
      break;
    case 'prev':
      if (s.currentIndex > 0) {
        next.currentIndex = s.currentIndex - 1;
        next.positionSec = 0;
        next.playing = true;
      } else {
        next.positionSec = 0;
      }
      break;
    case 'remove': {
      const i = action.index;
      if (i < 0 || i >= s.queue.length) break;
      next.queue = s.queue.filter((_, idx) => idx !== i);
      if (i < s.currentIndex) {
        next.currentIndex = s.currentIndex - 1;
      } else if (i === s.currentIndex) {
        next.positionSec = 0;
        if (next.currentIndex >= next.queue.length) {
          next.currentIndex = next.queue.length - 1;
        }
        if (next.currentIndex < 0) next.playing = false;
      }
      break;
    }
    case 'clear':
      next.queue = [];
      next.currentIndex = -1;
      next.playing = false;
      next.positionSec = 0;
      break;
  }

  next.updatedAtMs = nowMs;
  return next;
}
