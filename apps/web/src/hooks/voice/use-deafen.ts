import { useEffect, useRef, useState } from 'react';
import { Room, RoomEvent, RemoteParticipant } from 'livekit-client';
import { getSocket } from '../../lib/socket';

export function useDeafen(room: Room) {
  const [deafened, setDeafened] = useState(false);
  const prevMic = useRef(true);

  useEffect(() => {
    const apply = (p: RemoteParticipant) => p.setVolume(deafened ? 0 : 1);
    room.remoteParticipants.forEach(apply);
    const onConnect = (p: RemoteParticipant) => apply(p);
    room.on(RoomEvent.ParticipantConnected, onConnect);
    return () => {
      room.off(RoomEvent.ParticipantConnected, onConnect);
    };
  }, [room, deafened]);

  // Clear broadcast deafen state when leaving the voice channel.
  useEffect(() => {
    return () => {
      getSocket().emit('voice.deafen', { deafened: false });
    };
  }, []);

  const toggle = () =>
    setDeafened((d) => {
      const next = !d;
      if (next) {
        prevMic.current = room.localParticipant.isMicrophoneEnabled;
        room.localParticipant.setMicrophoneEnabled(false);
      } else if (prevMic.current) {
        room.localParticipant.setMicrophoneEnabled(true);
      }
      getSocket().emit('voice.deafen', { deafened: next });
      return next;
    });

  return { deafened, toggle };
}
