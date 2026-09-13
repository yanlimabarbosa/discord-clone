import { Suspense, lazy, useState } from 'react';
import { usePresenceRealtime } from '../../hooks/realtime/use-presence-realtime';
import { useSpeakingRealtime } from '../../hooks/realtime/use-speaking-realtime';
import { useUnreadRealtime } from '../../hooks/unread/use-unread-realtime';
import { useVoiceJoinRing } from '../../hooks/realtime/use-voice-join-ring';
import { useDeafenRealtime } from '../../hooks/voice/use-deafen-realtime';
import { useMuteRealtime } from '../../hooks/voice/use-mute-realtime';
import { useVoiceModerationRelay } from '../../hooks/voice/use-voice-moderation-relay';
import { usePersistentState } from '../../hooks/use-persistent-state';
import { ServerRail } from './server-rail';
import { ChannelSidebar } from './channel-sidebar';
import { ChannelView } from './channel-view';
import { MemberList } from './member-list';
import { Home } from './home';
import type { useAppShell } from './use-app-shell';

// The voice stage pulls the LiveKit SDK — keep it out of the entry chunk;
// dialogs are conditionally mounted, so their chunks only load when opened.
const VoiceStage = lazy(() =>
  import('./voice/voice-stage').then((m) => ({ default: m.VoiceStage })),
);
const CreateServerDialog = lazy(() =>
  import('./create-server-dialog').then((m) => ({
    default: m.CreateServerDialog,
  })),
);
const InviteDialog = lazy(() =>
  import('./invite-dialog').then((m) => ({ default: m.InviteDialog })),
);
const ExploreDialog = lazy(() =>
  import('./explore-dialog').then((m) => ({ default: m.ExploreDialog })),
);

type ShellBodyProps = {
  shell: ReturnType<typeof useAppShell>;
  inVoice: boolean;
};

export function ShellBody({ shell, inVoice }: ShellBodyProps) {
  usePresenceRealtime();
  useSpeakingRealtime();
  useUnreadRealtime(
    shell.servers,
    shell.homeActive ? null : shell.activeChannelId,
    shell.user?.id,
  );
  useVoiceJoinRing(shell.user?.id, shell.voice?.id ?? null);
  useDeafenRealtime();
  useMuteRealtime();
  useVoiceModerationRelay(shell.user?.id, (e) =>
    shell.moveToVoice({
      id: e.channelId,
      serverId: e.serverId,
      name: e.channelName,
      serverName: e.serverName,
    }),
  );
  const [creatingServer, setCreatingServer] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [exploring, setExploring] = useState(false);

  return (
    <div className="shell">
      <ServerRail
        servers={shell.servers}
        loading={shell.serversLoading}
        activeServerId={shell.activeServerId}
        homeActive={shell.homeActive}
        onSelect={shell.selectServer}
        onHome={shell.goHome}
        onCreate={() => setCreatingServer(true)}
        onExplore={() => setExploring(true)}
      />

      {shell.homeActive ? (
        <Home
          user={shell.user}
          pendingDmUserId={shell.pendingDmUserId}
          onPendingDmConsumed={shell.consumePendingDm}
        />
      ) : (
        <ServerBody
          shell={shell}
          inVoice={inVoice}
          onInvite={() => setInviting(true)}
        />
      )}

      <Suspense fallback={null}>
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
      </Suspense>
    </div>
  );
}

function VoiceConnecting({ name }: { name: string }) {
  return (
    <main className="content">
      <div className="content-empty">
        <div className="content-empty-logo">🔊</div>
        <h2>Connecting to {name}…</h2>
      </div>
    </main>
  );
}

type ServerBodyProps = {
  shell: ReturnType<typeof useAppShell>;
  inVoice: boolean;
  onInvite: () => void;
};

type TextPanel = 'none' | 'members';
type VoicePanel = 'none' | 'members' | 'chat';

function ServerBody({ shell, inVoice, onInvite }: ServerBodyProps) {
  // Side panels are mutually exclusive and remembered per context:
  // text channels default to the members list, voice defaults to nothing.
  const [textPanel, setTextPanel] = usePersistentState<TextPanel>(
    'nyx.textPanel',
    'members',
  );
  const [voicePanel, setVoicePanel] = usePersistentState<VoicePanel>(
    'nyx.voicePanel',
    'none',
  );

  const viewed = shell.activeChannel;
  const viewingConnectedVoice =
    inVoice && !!shell.voice && shell.voice.id === viewed?.id;
  const isVoiceView = viewed?.type === 'VOICE' && viewingConnectedVoice;
  const isTextView = viewed?.type === 'TEXT';

  const membersVisible = isVoiceView
    ? voicePanel === 'members'
    : isTextView && textPanel === 'members';

  const toggleTextMembers = () =>
    setTextPanel(textPanel === 'members' ? 'none' : 'members');
  const toggleVoiceMembers = () =>
    setVoicePanel(voicePanel === 'members' ? 'none' : 'members');
  const toggleVoiceChat = () =>
    setVoicePanel(voicePanel === 'chat' ? 'none' : 'chat');

  return (
    <>
      <ChannelSidebar
        server={shell.activeServer}
        channels={shell.channels}
        loading={
          shell.activeServer ? shell.channelsLoading : shell.serversLoading
        }
        activeChannelId={shell.activeChannelId}
        onSelectChannel={shell.selectChannel}
        onInvite={onInvite}
        onLeaveServer={shell.goHome}
        onMessageUser={shell.openDmWith}
        user={shell.user ?? undefined}
        onLogout={shell.logout}
        voice={shell.voice}
        inVoice={inVoice}
        onViewVoice={shell.viewVoice}
        onLeaveVoice={shell.leaveVoice}
      />

      {viewed?.type === 'VOICE' ? (
        viewingConnectedVoice && shell.voice ? (
          <Suspense fallback={<VoiceConnecting name={viewed.name} />}>
            <VoiceStage
              voice={shell.voice}
              chatOpen={voicePanel === 'chat'}
              membersOpen={voicePanel === 'members'}
              onToggleChat={toggleVoiceChat}
              onToggleMembers={toggleVoiceMembers}
            />
          </Suspense>
        ) : (
          <VoiceConnecting name={viewed.name} />
        )
      ) : viewed?.type === 'TEXT' ? (
        <ChannelView
          channel={viewed}
          membersOpen={textPanel === 'members'}
          onToggleMembers={toggleTextMembers}
        />
      ) : shell.serversLoading || shell.channelsLoading ? (
        <main className="content">
          <div className="content-empty" />
        </main>
      ) : (
        <main className="content">
          <div className="content-empty">
            <div className="content-empty-logo">◇</div>
            <h2>Welcome{shell.user ? `, ${shell.user.displayName}` : ''}</h2>
            <p>Pick a channel, or create a server to get started.</p>
          </div>
        </main>
      )}

      {membersVisible && (
        <MemberList
          serverId={shell.activeServerId}
          onMessageUser={shell.openDmWith}
        />
      )}
    </>
  );
}
