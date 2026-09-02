import { useState } from 'react';
import { useMe } from '../../hooks/auth/use-me';
import { useLogout } from '../../hooks/auth/use-logout';
import { useServers } from '../../hooks/servers/use-servers';
import { useChannels } from '../../hooks/channels/use-channels';
import type { Channel } from '../../types/server';

function firstTextChannel(channels: Channel[] | undefined): Channel | undefined {
  return channels?.find((c) => c.type === 'TEXT');
}

export function useAppShell() {
  const { data: user } = useMe();
  const logout = useLogout();
  const { data: servers } = useServers();

  const [pickedServerId, setPickedServerId] = useState<string | null>(null);
  const [pickedChannelId, setPickedChannelId] = useState<string | null>(null);

  const activeServerId = pickedServerId ?? servers?.[0]?.id ?? null;
  const { data: channels } = useChannels(activeServerId);
  const activeChannelId =
    pickedChannelId ?? firstTextChannel(channels)?.id ?? null;

  const activeServer = servers?.find((s) => s.id === activeServerId) ?? null;
  const activeChannel = channels?.find((c) => c.id === activeChannelId) ?? null;

  return {
    user,
    logout: () => logout.mutate(),
    servers: servers ?? [],
    channels: channels ?? [],
    activeServerId,
    activeChannelId,
    activeServer,
    activeChannel,
    selectServer: (id: string) => {
      setPickedServerId(id);
      setPickedChannelId(null);
    },
    selectChannel: (id: string) => setPickedChannelId(id),
  };
}
