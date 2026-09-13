import { Suspense, lazy } from 'react';
import { useAppShell } from './use-app-shell';
import { ShellBody } from './shell-body';
import { ConnectionBanner } from '../../components/connection-banner';

// The LiveKit SDK only crosses the wire when a voice channel is joined —
// everything LiveKit-related lives behind this lazy boundary (voice-shell).
const VoiceShell = lazy(() => import('./voice-shell'));

export function AppShell() {
  const shell = useAppShell();

  const body =
    shell.voice && shell.voiceToken ? (
      // While the voice chunk streams in, keep rendering the plain shell —
      // the voice channel view already shows its own "Connecting…" state,
      // so there is no dead moment.
      <Suspense fallback={<ShellBody shell={shell} inVoice={false} />}>
        <VoiceShell
          voiceId={shell.voice.id}
          token={shell.voiceToken}
          onLeaveVoice={shell.leaveVoice}
        >
          <ShellBody shell={shell} inVoice />
        </VoiceShell>
      </Suspense>
    ) : (
      <ShellBody shell={shell} inVoice={false} />
    );

  return (
    <>
      <ConnectionBanner />
      {body}
    </>
  );
}
