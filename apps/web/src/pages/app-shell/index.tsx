import { useState } from 'react';
import { useAppShell } from './use-app-shell';
import { ServerRail } from './server-rail';
import { ChannelSidebar } from './channel-sidebar';
import { ChannelView } from './channel-view';
import { CreateServerDialog } from './create-server-dialog';

export function AppShell() {
  const shell = useAppShell();
  const [creatingServer, setCreatingServer] = useState(false);

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
        user={shell.user}
        onLogout={shell.logout}
      />
      <ChannelView channel={shell.activeChannel} />
      {creatingServer && (
        <CreateServerDialog onClose={() => setCreatingServer(false)} />
      )}
    </div>
  );
}
