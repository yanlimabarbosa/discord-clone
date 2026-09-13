import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { LocalAudioTrack, RoomEvent, Track } from 'livekit-client';
import { voiceAudioStore } from '../../../lib/voice-audio-store';
import {
  RNNOISE_PROCESSOR_NAME,
  createRnnoiseProcessor,
  isRnnoiseSupported,
} from '../../../lib/rnnoise-processor';
import { toastStore } from '../../../lib/toast-store';

// Keeps the mic's RNNoise processor in sync with the persisted setting:
// attaches it when the mic publishes (or the toggle turns on mid-call) and
// detaches it when the toggle turns off. If the worklet/wasm fails to load
// the mic keeps publishing unprocessed and the setting flips itself off.
export function RnnoiseRelay() {
  const room = useRoomContext();
  const settings = useSyncExternalStore(
    voiceAudioStore.subscribe,
    voiceAudioStore.getSnapshot,
  );
  const wantRnnoise = settings.rnnoise;
  // Serializes set/stopProcessor calls so a fast toggle can't interleave.
  const queue = useRef(Promise.resolve());

  useEffect(() => {
    let disposed = false;

    const sync = () => {
      queue.current = queue.current.then(async () => {
        if (disposed) return;
        const track = room.localParticipant.getTrackPublication(
          Track.Source.Microphone,
        )?.track;
        if (!(track instanceof LocalAudioTrack)) return;
        const active =
          track.getProcessor()?.name === RNNOISE_PROCESSOR_NAME;
        if (wantRnnoise && !active) {
          if (!isRnnoiseSupported()) {
            toastStore.error('AI noise filter unavailable');
            voiceAudioStore.set({
              ...voiceAudioStore.getSnapshot(),
              rnnoise: false,
            });
            return;
          }
          try {
            await track.setProcessor(createRnnoiseProcessor());
          } catch (err) {
            console.error('[rnnoise] failed to enable', err);
            toastStore.error('AI noise filter unavailable');
            voiceAudioStore.set({
              ...voiceAudioStore.getSnapshot(),
              rnnoise: false,
            });
          }
        } else if (!wantRnnoise && active) {
          try {
            await track.stopProcessor();
          } catch (err) {
            console.error('[rnnoise] failed to disable', err);
          }
        }
      });
    };

    sync();
    room.on(RoomEvent.LocalTrackPublished, sync);
    return () => {
      disposed = true;
      room.off(RoomEvent.LocalTrackPublished, sync);
    };
  }, [room, wantRnnoise]);

  return null;
}
