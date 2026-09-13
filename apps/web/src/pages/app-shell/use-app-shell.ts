import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
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

type ParsedAppPath = {
  home: boolean;
  serverId: string | null;
  channelId: string | null;
};

// /channels/:serverId/:channelId and /channels/:serverId map to a server
// view; anything else ('/', '/home', unknown paths) is home. Unknown paths
// get normalized to /home by the canonicalization effect below.
function parseAppPath(pathname: string): ParsedAppPath {
  const withChannel = matchPath('/channels/:serverId/:channelId', pathname);
  if (withChannel) {
    return {
      home: false,
      serverId: withChannel.params.serverId ?? null,
      channelId: withChannel.params.channelId ?? null,
    };
  }
  const serverOnly = matchPath('/channels/:serverId', pathname);
  if (serverOnly) {
    return {
      home: false,
      serverId: serverOnly.params.serverId ?? null,
      channelId: null,
    };
  }
  return { home: true, serverId: null, channelId: null };
}

export function useAppShell() {
  const { data: user } = useMe();
  const logoutMutation = useLogout();
  const {
    data: servers,
    isLoading: serversLoading,
    isFetching: serversFetching,
  } = useServers();

  // The URL is the source of truth for where the user is looking (so refresh
  // and back/forward restore context); the voice connection is plain state so
  // a live call survives navigating anywhere in the app.
  const location = useLocation();
  const navigate = useNavigate();
  const parsed = useMemo(() => parseAppPath(location.pathname), [location.pathname]);

  const [voice, setVoice] = useState<ActiveVoice | null>(null);
  const [pendingDmUserId, setPendingDmUserId] = useState<string | null>(null);
  const [lastChannelByServer, setLastChannelByServer] = usePersistentState<
    Record<string, string>
  >('nyx.lastChannelByServer', {});

  const homeActive = parsed.home;
  const activeServerId = parsed.serverId ?? servers?.[0]?.id ?? null;
  const { data: channels, isLoading: channelsLoading } =
    useChannels(activeServerId);

  // Resolution order: channel in the URL → remembered channel for this server
  // → first text channel. URL/remembered ids are validated against the loaded
  // channel list so deleted channels can't be restored, and a voice channel in
  // the URL only counts while actually connected to it (a refresh drops the
  // call, so the URL falls back to a text channel instead of a dead voice view).
  const exists = (id: string | undefined | null) =>
    !!id && !!channels?.some((c) => c.id === id);
  const urlChannel = parsed.channelId
    ? channels?.find((c) => c.id === parsed.channelId) ?? null
    : null;
  const urlChannelValid =
    !!urlChannel && (urlChannel.type !== 'VOICE' || voice?.id === urlChannel.id);
  const rememberedChannelId = activeServerId
    ? lastChannelByServer[activeServerId]
    : undefined;
  const activeChannelId = urlChannelValid
    ? parsed.channelId
    : exists(rememberedChannelId)
      ? rememberedChannelId!
      : firstTextChannel(channels)?.id ?? null;

  const activeServer = servers?.find((s) => s.id === activeServerId) ?? null;
  const activeChannel = channels?.find((c) => c.id === activeChannelId) ?? null;

  const { data: voiceTokenData } = useVoiceToken(voice?.id ?? null);

  // Canonicalize the URL against loaded data: '/' and unknown paths become
  // /home, a server the user isn't in bounces home (only once the servers
  // list has settled, so a just-joined server mid-refetch isn't bounced),
  // and /channels/:serverId gets the resolved channel filled in via replace
  // so history stays one entry per user action.
  useEffect(() => {
    if (parsed.home) {
      if (location.pathname !== '/home') navigate('/home', { replace: true });
      return;
    }
    if (!parsed.serverId) return;
    if (
      servers &&
      !serversLoading &&
      !serversFetching &&
      !servers.some((s) => s.id === parsed.serverId)
    ) {
      navigate('/home', { replace: true });
      return;
    }
    if (channelsLoading || !channels) return;
    if (activeChannelId) {
      if (parsed.channelId !== activeChannelId) {
        navigate(`/channels/${parsed.serverId}/${activeChannelId}`, {
          replace: true,
        });
      }
    } else if (parsed.channelId) {
      navigate(`/channels/${parsed.serverId}`, { replace: true });
    }
  }, [
    parsed,
    location.pathname,
    servers,
    serversLoading,
    serversFetching,
    channels,
    channelsLoading,
    activeChannelId,
    navigate,
  ]);

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation.mutate]);

  // Ref mirror so navigation handlers keep stable identities — they are
  // passed down to memoized rows.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const go = useCallback((path: string) => {
    if (window.location.pathname !== path) navigateRef.current(path);
  }, []);

  const goHome = useCallback(() => go('/home'), [go]);

  const openDmWith = useCallback(
    (userId: string) => {
      setPendingDmUserId(userId);
      go('/home');
    },
    [go],
  );

  const consumePendingDm = useCallback(() => setPendingDmUserId(null), []);

  const selectServer = useCallback((id: string) => go(`/channels/${id}`), [go]);

  // Ref mirror so selectChannel keeps a stable identity across selections —
  // it is passed down to memoized channel rows.
  const lastChannelRef = useRef(lastChannelByServer);
  lastChannelRef.current = lastChannelByServer;

  const selectChannel = useCallback(
    (channel: Channel) => {
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
      go(`/channels/${channel.serverId}/${channel.id}`);
    },
    [setLastChannelByServer, activeServer?.name, go],
  );

  const viewVoice = useCallback(() => {
    if (!voice) return;
    go(`/channels/${voice.serverId}/${voice.id}`);
  }, [voice, go]);

  const moveToVoice = useCallback(
    (next: ActiveVoice) => {
      setVoice(next);
      go(`/channels/${next.serverId}/${next.id}`);
    },
    [go],
  );

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
