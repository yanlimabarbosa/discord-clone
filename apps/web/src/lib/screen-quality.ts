import type {
  ScreenShareCaptureOptions,
  TrackPublishOptions,
} from 'livekit-client';

export type ScreenResolution = '720p' | '1080p' | '1440p' | '4k';

export type ScreenQuality = {
  resolution: ScreenResolution;
  fps: number;
};

export type ResolutionPreset = {
  key: ScreenResolution;
  label: string;
  width: number;
  height: number;
};

export const RESOLUTIONS: ResolutionPreset[] = [
  { key: '720p', label: '720p', width: 1280, height: 720 },
  { key: '1080p', label: '1080p', width: 1920, height: 1080 },
  { key: '1440p', label: '1440p', width: 2560, height: 1440 },
  { key: '4k', label: '4K', width: 3840, height: 2160 },
];

export const FPS_OPTIONS = [15, 30, 60];

export const DEFAULT_SCREEN_QUALITY: ScreenQuality = {
  resolution: '1080p',
  fps: 60,
};

const MIN_BITRATE = 1_500_000;
const MAX_BITRATE = 30_000_000;

function bitrateFor(preset: ResolutionPreset, fps: number): number {
  const raw = Math.round(preset.width * preset.height * fps * 0.065);
  return Math.max(MIN_BITRATE, Math.min(MAX_BITRATE, raw));
}

export function screenShareOptions(quality: ScreenQuality): {
  capture: ScreenShareCaptureOptions;
  publish: TrackPublishOptions;
} {
  const preset =
    RESOLUTIONS.find((r) => r.key === quality.resolution) ?? RESOLUTIONS[1];
  return {
    capture: {
      audio: true,
      contentHint: 'motion',
      resolution: {
        width: preset.width,
        height: preset.height,
        frameRate: quality.fps,
      },
    },
    publish: {
      degradationPreference:
        quality.fps >= 60 ? 'maintain-framerate' : 'maintain-resolution',
      screenShareEncoding: {
        maxFramerate: quality.fps,
        maxBitrate: bitrateFor(preset, quality.fps),
      },
    },
  };
}
