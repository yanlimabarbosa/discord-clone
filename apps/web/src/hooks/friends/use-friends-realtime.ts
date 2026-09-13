import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '../../lib/socket';
import { toastStore } from '../../lib/toast-store';
import { useMe } from '../auth/use-me';
import type { FriendsData } from '../../types/friend';
import type { PublicUser } from '../../types/user';

type FriendUpdateEvent = {
  kind: 'request' | 'accepted' | 'removed';
  friendshipId: string;
  requester: PublicUser;
  addressee: PublicUser;
};

export function useFriendsRealtime() {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const meId = me?.id;

  useEffect(() => {
    if (!meId) return;
    const socket = getSocket();
    const onUpdate = (e: FriendUpdateEvent) => {
      const current = qc.getQueryData<FriendsData>(['friends']);
      if (current) {
        qc.setQueryData<FriendsData>(
          ['friends'],
          applyFriendUpdate(current, e, meId),
        );
      } else {
        qc.invalidateQueries({ queryKey: ['friends'] });
      }
      if (e.kind === 'request' && e.addressee.id === meId) {
        toastStore.info(`${e.requester.displayName} sent you a friend request`);
      }
    };
    socket.on('friend.update', onUpdate);
    return () => {
      socket.off('friend.update', onUpdate);
    };
  }, [qc, meId]);
}

// Removing the friendshipId from every list first makes the update idempotent
// with the optimistic updates the mutations already apply in this tab.
function applyFriendUpdate(
  data: FriendsData,
  e: FriendUpdateEvent,
  meId: string,
): FriendsData {
  const other = e.requester.id === meId ? e.addressee : e.requester;
  const entry = { friendshipId: e.friendshipId, user: other };
  const cleared = withoutFriendship(data, e.friendshipId);
  if (e.kind === 'removed') return cleared;
  if (e.kind === 'accepted') {
    return { ...cleared, friends: [...cleared.friends, entry] };
  }
  return e.addressee.id === meId
    ? { ...cleared, incoming: [...cleared.incoming, entry] }
    : { ...cleared, outgoing: [...cleared.outgoing, entry] };
}

function withoutFriendship(
  data: FriendsData,
  friendshipId: string,
): FriendsData {
  return {
    friends: data.friends.filter((f) => f.friendshipId !== friendshipId),
    incoming: data.incoming.filter((f) => f.friendshipId !== friendshipId),
    outgoing: data.outgoing.filter((f) => f.friendshipId !== friendshipId),
  };
}
