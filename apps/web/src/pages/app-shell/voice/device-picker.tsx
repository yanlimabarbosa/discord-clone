import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Settings } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { screenQualityStore } from '../../../lib/screen-quality-store';
import {
  RESOLUTIONS,
  FPS_OPTIONS,
  type ScreenResolution,
} from '../../../lib/screen-quality';

export function DevicePicker() {
  const room = useRoomContext();
  const [open, setOpen] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeMic, setActiveMic] = useState('');
  const [activeCam, setActiveCam] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const quality = useSyncExternalStore(
    screenQualityStore.subscribe,
    screenQualityStore.getSnapshot,
  );
  const isSharing = room.localParticipant.isScreenShareEnabled;

  useEffect(() => {
    if (!open) return;
    navigator.mediaDevices
      .enumerateDevices()
      .then(setDevices)
      .catch(() => setDevices([]));
    setActiveMic(room.getActiveDevice('audioinput') || '');
    setActiveCam(room.getActiveDevice('videoinput') || '');
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open, room]);

  // exact:true forces the browser to honor the pick; without it the deviceId
  // is only an "ideal" hint and switching silently no-ops.
  async function switchDevice(
    kind: 'audioinput' | 'videoinput',
    deviceId: string,
  ) {
    try {
      await room.switchActiveDevice(kind, deviceId, true);
      if (kind === 'audioinput') setActiveMic(deviceId);
      else setActiveCam(deviceId);
    } catch (err) {
      console.error('[devices] switch failed', kind, err);
    }
  }

  const mics = devices.filter((d) => d.kind === 'audioinput');
  const cams = devices.filter((d) => d.kind === 'videoinput');

  return (
    <div className="vc-device" ref={ref}>
      <button
        className={`vc-ctrl-btn ${open ? 'vc-ctrl-active' : ''}`}
        title="Audio & video devices"
        onClick={() => setOpen((o) => !o)}
      >
        <Settings size={20} />
      </button>
      {open && (
        <div className="vc-device-menu">
          <div className="vc-device-group">Microphone</div>
          {mics.length === 0 && <div className="vc-device-empty">No devices</div>}
          {mics.map((d) => (
            <button
              key={d.deviceId}
              className={`vc-device-item ${d.deviceId === activeMic ? 'vc-device-active' : ''}`}
              onClick={() => switchDevice('audioinput', d.deviceId)}
            >
              <span>{d.label || 'Microphone'}</span>
              {d.deviceId === activeMic && <span>✓</span>}
            </button>
          ))}
          <div className="vc-device-group">Camera</div>
          {cams.length === 0 && <div className="vc-device-empty">No devices</div>}
          {cams.map((d) => (
            <button
              key={d.deviceId}
              className={`vc-device-item ${d.deviceId === activeCam ? 'vc-device-active' : ''}`}
              onClick={() => switchDevice('videoinput', d.deviceId)}
            >
              <span>{d.label || 'Camera'}</span>
              {d.deviceId === activeCam && <span>✓</span>}
            </button>
          ))}

          <div className="vc-device-group">Screen share quality</div>
          <div className="vc-quality-row">
            {RESOLUTIONS.map((r) => (
              <button
                key={r.key}
                className={`vc-quality-chip ${quality.resolution === r.key ? 'vc-quality-on' : ''}`}
                aria-pressed={quality.resolution === r.key}
                onClick={() =>
                  screenQualityStore.set({ ...quality, resolution: r.key as ScreenResolution })
                }
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="vc-quality-row">
            {FPS_OPTIONS.map((f) => (
              <button
                key={f}
                className={`vc-quality-chip ${quality.fps === f ? 'vc-quality-on' : ''}`}
                aria-pressed={quality.fps === f}
                onClick={() => screenQualityStore.set({ ...quality, fps: f })}
              >
                {f} fps
              </button>
            ))}
          </div>
          {isSharing && (
            <div className="vc-quality-hint">
              Applies next time you start sharing
            </div>
          )}
        </div>
      )}
    </div>
  );
}
