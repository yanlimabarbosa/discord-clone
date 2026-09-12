import { useCallback, useEffect, useRef, useState } from 'react';
import { getSocket } from '../../lib/socket';
import { useYouTubePlayer } from './use-youtube-player';
import { EMPTY_WATCH, type WatchState, type WatchVideo } from '../../types/watch';

type ServerAction =
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

const DRIFT_TOLERANCE = 2.5;

export function useWatchSession(channelId: string) {
  const [state, setState] = useState<WatchState>(EMPTY_WATCH);
  const stateRef = useRef<WatchState>(EMPTY_WATCH);
  const receivedAtRef = useRef<number>(0);
  const applyingRemoteRef = useRef(false);

  const send = useCallback(
    (action: ServerAction) => {
      getSocket().emit('watch.control', { channelId, action });
    },
    [channelId],
  );

  const expectedPosition = useCallback((s: WatchState) => {
    if (!s.playing) return s.positionSec;
    return s.positionSec + (Date.now() - receivedAtRef.current) / 1000;
  }, []);

  const player = useYouTubePlayer({
    onStateChange: (ytState) => {
      // 0 = ended, 1 = playing, 2 = paused
      if (applyingRemoteRef.current) return;
      if (ytState === 0) {
        send({ type: 'ended' });
      } else if (ytState === 1) {
        send({ type: 'play' });
      } else if (ytState === 2) {
        send({ type: 'pause' });
      }
    },
  });
  const { api, ready } = player;

  const reconcile = useCallback(
    (s: WatchState) => {
      if (!ready) return;
      const cur = s.queue[s.currentIndex];
      applyingRemoteRef.current = true;
      if (!cur) {
        if (api.isPlaying()) api.pause();
      } else if (api.getVideoId() !== cur.id) {
        const pos = expectedPosition(s);
        if (s.playing) api.load(cur.id, pos);
        else api.cue(cur.id, pos);
      } else {
        const target = expectedPosition(s);
        if (Math.abs(api.getTime() - target) > DRIFT_TOLERANCE) {
          api.seek(target);
        }
        if (s.playing && !api.isPlaying()) api.play();
        if (!s.playing && api.isPlaying()) api.pause();
      }
      window.setTimeout(() => {
        applyingRemoteRef.current = false;
      }, 900);
    },
    [api, ready, expectedPosition],
  );

  // Subscribe to server state.
  useEffect(() => {
    const socket = getSocket();
    socket.emit('watch.join', { channelId });
    const onState = (msg: { channelId: string; state: WatchState }) => {
      if (msg.channelId !== channelId) return;
      stateRef.current = msg.state;
      receivedAtRef.current = Date.now();
      setState(msg.state);
      reconcile(msg.state);
    };
    socket.on('watch.state', onState);
    return () => {
      socket.emit('watch.leave', { channelId });
      socket.off('watch.state', onState);
    };
  }, [channelId, reconcile]);

  // Re-sync once the player becomes ready (state may have arrived first).
  useEffect(() => {
    if (ready) reconcile(stateRef.current);
  }, [ready, reconcile]);

  // Periodic drift correction.
  useEffect(() => {
    const id = window.setInterval(() => {
      const s = stateRef.current;
      if (!ready || s.currentIndex < 0 || !s.playing) return;
      if (applyingRemoteRef.current) return;
      const cur = s.queue[s.currentIndex];
      if (!cur || api.getVideoId() !== cur.id) return;
      const target = expectedPosition(s);
      if (Math.abs(api.getTime() - target) > DRIFT_TOLERANCE) {
        applyingRemoteRef.current = true;
        api.seek(target);
        window.setTimeout(() => (applyingRemoteRef.current = false), 600);
      }
    }, 4000);
    return () => window.clearInterval(id);
  }, [ready, api, expectedPosition]);

  const controls = {
    addVideo: (video: WatchVideo) => send({ type: 'add', video }),
    playAt: (index: number) => send({ type: 'playAt', index }),
    togglePlay: () => send({ type: state.playing ? 'pause' : 'play' }),
    play: () => send({ type: 'play' }),
    pause: () => send({ type: 'pause' }),
    next: () => send({ type: 'next' }),
    prev: () => send({ type: 'prev' }),
    remove: (index: number) => send({ type: 'remove', index }),
    clear: () => send({ type: 'clear' }),
    seek: (position: number) => send({ type: 'seek', position }),
    resync: () => reconcile(stateRef.current),
  };

  return { hostRef: player.hostRef, ready, state, controls, api };
}
