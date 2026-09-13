import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../lib/socket';
import './connection-banner.css';

type BannerState = 'hidden' | 'reconnecting' | 'reconnected';

const RECONNECTED_VISIBLE_MS = 2000;

export function ConnectionBanner() {
  const qc = useQueryClient();
  const [state, setState] = useState<BannerState>('hidden');
  const hideTimer = useRef<number | null>(null);
  const wasDisconnected = useRef(false);

  useEffect(() => {
    const socket = getSocket();

    const onDisconnect = () => {
      if (hideTimer.current !== null) {
        window.clearTimeout(hideTimer.current);
        hideTimer.current = null;
      }
      wasDisconnected.current = true;
      setState('reconnecting');
    };

    const onConnect = () => {
      if (!wasDisconnected.current) return;
      wasDisconnected.current = false;
      // Socket events were missed while offline — refetch what's on screen.
      qc.invalidateQueries({ refetchType: 'active' });
      setState('reconnected');
      hideTimer.current = window.setTimeout(() => {
        hideTimer.current = null;
        setState('hidden');
      }, RECONNECTED_VISIBLE_MS);
    };

    socket.on('disconnect', onDisconnect);
    socket.on('connect', onConnect);
    return () => {
      socket.off('disconnect', onDisconnect);
      socket.off('connect', onConnect);
      if (hideTimer.current !== null) window.clearTimeout(hideTimer.current);
    };
  }, [qc]);

  if (state === 'hidden') return null;

  return (
    <div className={`connection-banner connection-banner-${state}`} role="status">
      {state === 'reconnecting' ? 'Reconnecting…' : 'Reconnected'}
    </div>
  );
}
