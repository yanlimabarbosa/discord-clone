import { useEffect } from 'react';
import type { LocalParticipant } from 'livekit-client';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
}

export function usePushToTalk(
  localParticipant: LocalParticipant,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled) return;
    localParticipant.setMicrophoneEnabled(false);

    const onDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || isTypingTarget(e.target)) return;
      e.preventDefault();
      localParticipant.setMicrophoneEnabled(true);
    };
    const onUp = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || isTypingTarget(e.target)) return;
      e.preventDefault();
      localParticipant.setMicrophoneEnabled(false);
    };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      localParticipant.setMicrophoneEnabled(true);
    };
  }, [enabled, localParticipant]);
}
