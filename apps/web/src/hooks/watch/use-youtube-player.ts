import { useEffect, useMemo, useRef, useState } from 'react';

/* eslint-disable @typescript-eslint/no-explicit-any */
let apiPromise: Promise<void> | null = null;

function loadYouTubeApi(): Promise<void> {
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<void>((resolve) => {
    const w = window as any;
    if (w.YT && w.YT.Player) return resolve();
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => {
      if (typeof prev === 'function') prev();
      resolve();
    };
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
  return apiPromise;
}

export type YouTubeApi = {
  load: (videoId: string, startSeconds: number) => void;
  cue: (videoId: string, startSeconds: number) => void;
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  getTime: () => number;
  getDuration: () => number;
  isPlaying: () => boolean;
  getVideoId: () => string;
};

type Handlers = {
  onReady?: () => void;
  onStateChange?: (state: number) => void;
};

export function useYouTubePlayer(handlers: Handlers) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadYouTubeApi().then(() => {
      if (cancelled || !hostRef.current) return;
      const w = window as any;
      const inner = document.createElement('div');
      hostRef.current.appendChild(inner);
      playerRef.current = new w.YT.Player(inner, {
        width: '100%',
        height: '100%',
        videoId: '',
        playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
        events: {
          onReady: () => {
            setReady(true);
            handlersRef.current.onReady?.();
          },
          onStateChange: (e: any) =>
            handlersRef.current.onStateChange?.(e.data),
        },
      });
    });
    return () => {
      cancelled = true;
      try {
        playerRef.current?.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    };
  }, []);

  const api = useMemo<YouTubeApi>(
    () => ({
      load: (videoId, startSeconds) =>
        playerRef.current?.loadVideoById(videoId, startSeconds),
      cue: (videoId, startSeconds) =>
        playerRef.current?.cueVideoById(videoId, startSeconds),
      play: () => playerRef.current?.playVideo(),
      pause: () => playerRef.current?.pauseVideo(),
      seek: (seconds) => playerRef.current?.seekTo(seconds, true),
      getTime: () => {
        try {
          return playerRef.current?.getCurrentTime() ?? 0;
        } catch {
          return 0;
        }
      },
      getDuration: () => {
        try {
          return playerRef.current?.getDuration() ?? 0;
        } catch {
          return 0;
        }
      },
      isPlaying: () => {
        try {
          return playerRef.current?.getPlayerState() === 1; // YT.PlayerState.PLAYING
        } catch {
          return false;
        }
      },
      getVideoId: () => {
        try {
          return playerRef.current?.getVideoData()?.video_id ?? '';
        } catch {
          return '';
        }
      },
    }),
    [],
  );

  return { hostRef, ready, api };
}
