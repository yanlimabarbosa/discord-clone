import { Suspense, lazy } from 'react';

// Lazy shim: the real toggles (live-voice-toggles-impl) touch the LiveKit
// room context, and this component is only rendered while connected to
// voice — by which point the LiveKit chunk is already loading for the call.
// Keeping the implementation behind lazy() keeps LiveKit out of the entry
// chunk without changing the user-panel's import.
const LiveVoiceTogglesImpl = lazy(() => import('./live-voice-toggles-impl'));

type LiveVoiceTogglesProps = {
  userId: string | undefined;
};

export function LiveVoiceToggles({ userId }: LiveVoiceTogglesProps) {
  return (
    <Suspense fallback={null}>
      <LiveVoiceTogglesImpl userId={userId} />
    </Suspense>
  );
}
