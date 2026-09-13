import { useCallback, useRef, useState } from 'react';
import { useMe } from '../../hooks/auth/use-me';
import { useLogout } from '../../hooks/auth/use-logout';
import { useServers } from '../../hooks/servers/use-servers';
import { useChannels } from '../../hooks/channels/use-channels';
import { useVoiceToken } from '../../hooks/voice/use-voice-token';
import { usePersistentState } from '../../hooks/use-persistent-state';
import type { Channel } from '../../types/server';

function firstTextChannel(channels: Channel[] | undefined): Channel | undefined {
  return channels?.find((c) => c.type === 'TEXT');
}

export type ActiveVoice = {
  id: string;
  serverId: string;
  name: string;
  serverName: string;
};

export function useAppShell() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const { data: servers, isLoading: serversLoading } = useServers();

  const [pickedServerId, setPickedServerId] = useState<string | null>(null);
  const [pickedChannelId, setPickedChannelId] = useState<string | null>(null);
  const [voice, setVoice] = useState<ActiveVoice | null>(null);
  const [homeActive, setHomeActive] = useState(true);
  const [pendingDmUserId, setPendingDmUserId] = useState<string | null>(null);
  const [lastChannelByServer, setLastChannelByServer] = usePersistentState<
    Record<string, string>
  >('nyx.lastChannelByServer', {});

  const activeServerId = pickedServerId ?? servers?.[0]?.id ?? null;
  const { data: channels, isLoading: channelsLoading } =
    useChannels(activeServerId);

  // Resolution order: explicit pick → remembered channel for this server →
  // first text channel. Remembered/picked ids are validated against the
  // loaded channel list so deleted channels can't be restored.
  const exists = (id: string | undefined | null) =>
    !!id && !!channels?.some((c) => c.id === id);
  const rememberedChannelId = activeServerId
    ? lastChannelByServer[activeServerId]
    : undefined;
  const activeChannelId = exists(pickedChannelId)
    ? pickedChannelId
    : exists(rememberedChannelId)
      ? rememberedChannelId!
      : firstTextChannel(channels)?.id ?? null;

  const activeServer = servers?.find((s) => s.id === activeServerId) ?? null;
  const activeChannel = channels?.find((c) => c.id === activeChannelId) ?? null;

  const { data: voiceTokenData } = useVoiceToken(voice?.id ?? null);

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation.mutate]);

  const goHome = useCallback(() => setHomeActive(true), []);

  const openDmWith = useCallback((userId: string) => {
    setHomeActive(true);
    setPendingDmUserId(userId);
  }, []);

  const consumePendingDm = useCallback(() => setPendingDmUserId(null), []);

  const selectServer = useCallback((id: string) => {
    setHomeActive(false);
    setPickedServerId(id);
    setPickedChannelId(null);
  }, []);

  // Ref mirror so selectChannel keeps a stable identity across selections —
  // it is passed down to memoized channel rows.
  const lastChannelRef = useRef(lastChannelByServer);
  lastChannelRef.current = lastChannelByServer;

  const selectChannel = useCallback(
    (channel: Channel) => {
      setHomeActive(false);
      setPickedChannelId(channel.id);
      if (channel.type === 'TEXT') {
        setLastChannelByServer({
          ...lastChannelRef.current,
          [channel.serverId]: channel.id,
        });
      }
      if (channel.type === 'VOICE') {
        setVoice({
          id: channel.id,
          serverId: channel.serverId,
          name: channel.name,
          serverName: activeServer?.name ?? '',
        });
      }
    },
    [setLastChannelByServer, activeServer?.name],
  );

  const viewVoice = useCallback(() => {
    if (!voice) return;
    setHomeActive(false);
    setPickedServerId(voice.serverId);
    setPickedChannelId(voice.id);
  }, [voice]);

  const moveToVoice = useCallback((next: ActiveVoice) => {
    setHomeActive(false);
    setVoice(next);
    setPickedServerId(next.serverId);
    setPickedChannelId(next.id);
  }, []);

  const leaveVoice = useCallback(() => setVoice(null), []);

  return {
    user,
    logout,
    servers: servers ?? [],
    serversLoading,
    channels: channels ?? [],
    channelsLoading,
    activeServerId,
    activeChannelId,
    activeServer,
    activeChannel,
    firstTextChannelId: firstTextChannel(channels)?.id ?? null,
    voice,
    voiceToken: voiceTokenData?.token ?? null,
    homeActive,
    pendingDmUserId,
    goHome,
    openDmWith,
    consumePendingDm,
    selectServer,
    selectChannel,
    viewVoice,
    moveToVoice,
    leaveVoice,
  };
}
