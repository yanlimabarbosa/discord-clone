const STORAGE_KEY = 'nyx.voiceAudio';

export type VoiceAudioSettings = {
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  rnnoise: boolean;
};

export const DEFAULT_VOICE_AUDIO: VoiceAudioSettings = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  rnnoise: true,
};

function load(): VoiceAudioSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_AUDIO;
    return { ...DEFAULT_VOICE_AUDIO, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_VOICE_AUDIO;
  }
}

let current = load();
const listeners = new Set<() => void>();

export const voiceAudioStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot() {
    return current;
  },
  set(settings: VoiceAudioSettings) {
    current = settings;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore storage failures (private mode, quota)
    }
    for (const listener of listeners) listener();
  },
};
