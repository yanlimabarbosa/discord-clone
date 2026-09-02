import { useState } from 'react';
import { usePresenceRealtime } from '../../hooks/realtime/use-presence-realtime';
import { useSpeakingRealtime } from '../../hooks/realtime/use-speaking-realtime';
import { ServerRail } from './server-rail';
import { ChannelSidebar } from './channel-sidebar';
import { ChannelView } from './channel-view';
import { VoiceStage } from './voice/voice-stage';
import { MemberList } from './member-list';
import { CreateServerDialog } from './create-server-dialog';
import { InviteDialog } from './invite-dialog';
import { ExploreDialog } from './explore-dialog';
import type { useAppShell } from './use-app-shell';

type ShellBodyProps = {
  shell: ReturnType<typeof useAppShell>;
  inVoice: boolean;
};

export function ShellBody({ shell, inVoice }: ShellBodyProps) {
  usePresenceRealtime();
  useSpeakingRealtime();
  const [creatingServer, setCreatingServer] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [exploring, setExploring] = useState(false);
  const [showMembers, setShowMembers] = useState(true);
  const toggleMembers = () => setShowMembers((s) => !s);

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
        onExplore={() => setExploring(true)}
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
          <VoiceStage voice={shell.voice} onToggleMembers={toggleMembers} />
        ) : (
          <main className="content">
            <div className="content-empty">
              <div className="content-empty-logo">🔊</div>
              <h2>Connecting to {viewed.name}…</h2>
            </div>
          </main>
        )
      ) : viewed?.type === 'TEXT' ? (
        <ChannelView channel={viewed} onToggleMembers={toggleMembers} />
      ) : (
        <main className="content">
          <div className="content-empty">
            <div className="content-empty-logo">◇</div>
            <h2>Welcome{shell.user ? `, ${shell.user.displayName}` : ''}</h2>
            <p>Pick a channel, or create a server to get started.</p>
          </div>
        </main>
      )}

      {showMembers && <MemberList serverId={shell.activeServerId} />}

      {creatingServer && (
        <CreateServerDialog onClose={() => setCreatingServer(false)} />
      )}
      {inviting && shell.activeServer && (
        <InviteDialog
          server={shell.activeServer}
          isOwner={shell.activeServer.ownerId === shell.user?.id}
          onClose={() => setInviting(false)}
        />
      )}
      {exploring && (
        <ExploreDialog
          onClose={() => setExploring(false)}
          onJoined={shell.selectServer}
        />
      )}
    </div>
  );
}
