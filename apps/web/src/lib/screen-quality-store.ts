import {
  DEFAULT_SCREEN_QUALITY,
  type ScreenQuality,
} from './screen-quality';

const STORAGE_KEY = 'nyx.screenQuality';

function load(): ScreenQuality {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SCREEN_QUALITY;
    return { ...DEFAULT_SCREEN_QUALITY, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SCREEN_QUALITY;
  }
}

let current = load();
const listeners = new Set<() => void>();

export const screenQualityStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current;
  },
  set(quality: ScreenQuality) {
    current = quality;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quality));
    } catch {
      // ignore storage failures (private mode, quota)
    }
    for (const listener of listeners) listener();
  },
};
