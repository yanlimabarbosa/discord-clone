import type {
  AudioProcessorOptions,
  Track,
  TrackProcessor,
} from 'livekit-client';
import {
  RnnoiseWorkletNode,
  loadRnnoise,
} from '@sapphi-red/web-noise-suppressor';
import rnnoiseWorkletPath from '@sapphi-red/web-noise-suppressor/rnnoiseWorklet.js?url';
import rnnoiseWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise.wasm?url';
import rnnoiseSimdWasmPath from '@sapphi-red/web-noise-suppressor/rnnoise_simd.wasm?url';

export const RNNOISE_PROCESSOR_NAME = 'rnnoise';

// RNNoise's model operates on 480-sample frames at 48kHz; running the graph
// at any other rate would feed it mistuned audio, so the processor owns a
// dedicated 48kHz context and lets the browser resample the mic into it.
const RNNOISE_SAMPLE_RATE = 48_000;

let wasmBinaryPromise: Promise<ArrayBuffer> | null = null;

// Cache the wasm fetch across processor instances, but drop a rejected
// promise so a transient network failure doesn't poison future attempts.
function fetchWasmBinary(): Promise<ArrayBuffer> {
  if (!wasmBinaryPromise) {
    wasmBinaryPromise = loadRnnoise({
      url: rnnoiseWasmPath,
      simdUrl: rnnoiseSimdWasmPath,
    }).catch((err) => {
      wasmBinaryPromise = null;
      throw err;
    });
  }
  return wasmBinaryPromise;
}

export function isRnnoiseSupported(): boolean {
  return (
    typeof AudioContext !== 'undefined' &&
    typeof AudioWorkletNode !== 'undefined' &&
    typeof WebAssembly !== 'undefined'
  );
}

// LiveKit TrackProcessor for the mic: source → RNNoise worklet → destination,
// with the destination's track handed back as processedTrack. LiveKit swaps
// it onto the sender via replaceTrack and calls destroy() when the underlying
// track stops, so lifecycle is fully managed by the SDK.
class RnnoiseProcessor
  implements TrackProcessor<Track.Kind.Audio, AudioProcessorOptions>
{
  name = RNNOISE_PROCESSOR_NAME;
  processedTrack?: MediaStreamTrack;

  private context?: AudioContext;
  private source?: MediaStreamAudioSourceNode;
  private rnnoise?: RnnoiseWorkletNode;
  private destination?: MediaStreamAudioDestinationNode;

  async init(opts: AudioProcessorOptions): Promise<void> {
    const wasmBinary = await fetchWasmBinary();
    const context = new AudioContext({
      sampleRate: RNNOISE_SAMPLE_RATE,
      latencyHint: 'interactive',
    });
    try {
      await context.audioWorklet.addModule(rnnoiseWorkletPath);
      this.rnnoise = new RnnoiseWorkletNode(context, {
        wasmBinary,
        maxChannels: 2,
      });
      this.destination = context.createMediaStreamDestination();
      this.source = context.createMediaStreamSource(
        new MediaStream([opts.track]),
      );
      this.source.connect(this.rnnoise);
      this.rnnoise.connect(this.destination);
      if (context.state === 'suspended') {
        await context.resume().catch(() => {});
      }
      this.context = context;
      this.processedTrack = this.destination.stream.getAudioTracks()[0];
    } catch (err) {
      await context.close().catch(() => {});
      this.rnnoise = undefined;
      this.destination = undefined;
      this.source = undefined;
      throw err;
    }
  }

  // Called by LiveKit whenever the underlying mic track is re-acquired
  // (device switch, unmute with stopMicTrackOnMute, constraint restart).
  // Only the source changes; the worklet, destination and processedTrack
  // survive so the sender keeps its replaced track.
  async restart(opts: AudioProcessorOptions): Promise<void> {
    if (!this.context || !this.rnnoise) {
      await this.destroy();
      await this.init(opts);
      return;
    }
    this.source?.disconnect();
    this.source = this.context.createMediaStreamSource(
      new MediaStream([opts.track]),
    );
    this.source.connect(this.rnnoise);
    if (this.context.state === 'suspended') {
      await this.context.resume().catch(() => {});
    }
  }

  async destroy(): Promise<void> {
    this.source?.disconnect();
    this.rnnoise?.disconnect();
    this.rnnoise?.destroy();
    this.processedTrack?.stop();
    this.source = undefined;
    this.rnnoise = undefined;
    this.destination = undefined;
    this.processedTrack = undefined;
    const context = this.context;
    this.context = undefined;
    if (context) {
      await context.close().catch(() => {});
    }
  }
}

export function createRnnoiseProcessor(): TrackProcessor<
  Track.Kind.Audio,
  AudioProcessorOptions
> {
  return new RnnoiseProcessor();
}
