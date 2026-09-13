import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Settings } from 'lucide-react';
import { useRoomContext } from '@livekit/components-react';
import { LocalAudioTrack, Track } from 'livekit-client';
import { Tooltip } from '../../../components/tooltip';
import { screenQualityStore } from '../../../lib/screen-quality-store';
import {
  RESOLUTIONS,
  FPS_OPTIONS,
  type ScreenResolution,
} from '../../../lib/screen-quality';
import { voiceAudioStore } from '../../../lib/voice-audio-store';

type DspKey = 'echoCancellation' | 'noiseSuppression' | 'autoGainControl';

const DSP_TOGGLES: { key: DspKey; label: string; tip: string }[] = [
  {
    key: 'echoCancellation',
    label: 'Echo',
    tip: 'Cancels echo from your speakers',
  },
  {
    key: 'noiseSuppression',
    label: 'Noise',
    tip: 'Suppresses steady background noise',
  },
  {
    key: 'autoGainControl',
    label: 'Gain',
    tip: 'Keeps your mic volume level steady',
  },
];

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

  const audio = useSyncExternalStore(
    voiceAudioStore.subscribe,
    voiceAudioStore.getSnapshot,
  );

  // Browser DSP constraints can be applied on the live MediaStreamTrack —
  // no re-acquire, so the active device and any track processor survive.
  async function toggleDsp(key: DspKey) {
    const next = { ...audio, [key]: !audio[key] };
    voiceAudioStore.set(next);
    const track = room.localParticipant.getTrackPublication(
      Track.Source.Microphone,
    )?.track;
    if (!(track instanceof LocalAudioTrack)) return;
    try {
      await track.applyConstraints({
        echoCancellation: next.echoCancellation,
        noiseSuppression: next.noiseSuppression,
        autoGainControl: next.autoGainControl,
      });
    } catch (err) {
      console.error('[voice] applying mic processing failed', err);
    }
  }

  const mics = devices.filter((d) => d.kind === 'audioinput');
  const cams = devices.filter((d) => d.kind === 'videoinput');

  return (
    <div className="vc-device" ref={ref}>
      <Tooltip label="Audio & video devices">
        <button
          className={`vc-ctrl-btn ${open ? 'vc-ctrl-active' : ''}`}
          aria-label="Audio & video devices"
          onClick={() => setOpen((o) => !o)}
        >
          <Settings size={20} />
        </button>
      </Tooltip>
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

          <div className="vc-device-group">Voice processing</div>
          <div className="vc-quality-row">
            {DSP_TOGGLES.map((t) => (
              <Tooltip key={t.key} label={t.tip}>
                <button
                  className={`vc-quality-chip ${audio[t.key] ? 'vc-quality-on' : ''}`}
                  aria-pressed={audio[t.key]}
                  onClick={() => toggleDsp(t.key)}
                >
                  {t.label}
                </button>
              </Tooltip>
            ))}
          </div>
          <div className="vc-quality-row">
            <Tooltip label="Removes background noise (keyboard, fans, other voices) with an AI filter that runs on your device">
              <button
                className={`vc-quality-chip ${audio.rnnoise ? 'vc-quality-on' : ''}`}
                aria-pressed={audio.rnnoise}
                onClick={() =>
                  voiceAudioStore.set({ ...audio, rnnoise: !audio.rnnoise })
                }
              >
                AI noise filter
              </button>
            </Tooltip>
          </div>

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
