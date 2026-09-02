import { useState } from 'react';
import { usePresenceRealtime } from '../../hooks/realtime/use-presence-realtime';
import { ServerRail } from './server-rail';
import { ChannelSidebar } from './channel-sidebar';
import { ChannelView } from './channel-view';
import { VoiceStage } from './voice/voice-stage';
import { MemberList } from './member-list';
import { CreateServerDialog } from './create-server-dialog';
import { InviteDialog } from './invite-dialog';
import type { useAppShell } from './use-app-shell';

type ShellBodyProps = {
  shell: ReturnType<typeof useAppShell>;
  inVoice: boolean;
};

export function ShellBody({ shell, inVoice }: ShellBodyProps) {
  usePresenceRealtime();
  const [creatingServer, setCreatingServer] = useState(false);
  const [inviting, setInviting] = useState(false);

  const viewed = shell.activeChannel;
  const viewingConnectedVoice =
    inVoice && !!shell.voice && shell.voice.id === viewed?.id;

  return (
    <div className="shell">
      <ServerRail
        servers={shell.servers}
        activeServerId={shell.activeServerId}
        onSelect={shell.selectServer}
        onCreate={() => setCreatingServer(true)}
      />
      <ChannelSidebar
        server={shell.activeServer}
        channels={shell.channels}
        activeChannelId={shell.activeChannelId}
        onSelectChannel={shell.selectChannel}
        onInvite={() => setInviting(true)}
        user={shell.user}
        onLogout={shell.logout}
        voice={shell.voice}
        inVoice={inVoice}
        onViewVoice={shell.viewVoice}
        onLeaveVoice={shell.leaveVoice}
      />

      {viewed?.type === 'VOICE' ? (
        viewingConnectedVoice && shell.voice ? (
          <VoiceStage voice={shell.voice} />
        ) : (
          <main className="content">
            <div className="content-empty">
              <div className="content-empty-logo">🔊</div>
              <h2>Connecting to {viewed.name}…</h2>
            </div>
          </main>
        )
      ) : viewed?.type === 'TEXT' ? (
        <ChannelView channel={viewed} />
      ) : (
        <main className="content">
          <div className="content-empty">
            <div className="content-empty-logo">◇</div>
            <h2>Welcome{shell.user ? `, ${shell.user.displayName}` : ''}</h2>
            <p>Pick a channel, or create a server to get started.</p>
          </div>
        </main>
      )}

      <MemberList serverId={shell.activeServerId} />

      {creatingServer && (
        <CreateServerDialog onClose={() => setCreatingServer(false)} />
      )}
      {inviting && shell.activeServer && (
        <InviteDialog
          serverId={shell.activeServer.id}
          onClose={() => setInviting(false)}
        />
      )}
    </div>
  );
}
