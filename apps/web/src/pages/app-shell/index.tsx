import { useState } from 'react';
import { useAppShell } from './use-app-shell';
import { ServerRail } from './server-rail';
import { ChannelSidebar } from './channel-sidebar';
import { ChannelView } from './channel-view';
import { VoiceView } from './voice-view';
import { CreateServerDialog } from './create-server-dialog';
import { InviteDialog } from './invite-dialog';

export function AppShell() {
  const shell = useAppShell();
  const [creatingServer, setCreatingServer] = useState(false);
  const [inviting, setInviting] = useState(false);

  const active = shell.activeChannel;

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
      />
      {active?.type === 'VOICE' ? (
        <VoiceView
          key={active.id}
          channel={active}
          onLeave={() => shell.selectChannel(shell.firstTextChannelId ?? active.id)}
        />
      ) : (
        <ChannelView channel={active} />
      )}
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
