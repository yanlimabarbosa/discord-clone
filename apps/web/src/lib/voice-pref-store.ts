const STORAGE_KEY = 'nyx.voicePrefs';

export type VoicePrefs = {
  muted: boolean;
  deafened: boolean;
};

const DEFAULT_PREFS: VoicePrefs = { muted: false, deafened: false };

function load(): VoicePrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFS;
  }
}

let current = load();
const listeners = new Set<() => void>();

export const voicePrefStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current;
  },
  set(prefs: VoicePrefs) {
    current = prefs;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage failures (private mode, quota)
    }
    for (const listener of listeners) listener();
  },
};
