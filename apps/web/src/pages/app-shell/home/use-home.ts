import { useState } from 'react';
import { useFriends } from '../../../hooks/friends/use-friends';
import { useDms } from '../../../hooks/dms/use-dms';
import { useOpenDm } from '../../../hooks/dms/use-open-dm';
import type { PublicUser } from '../../../types/user';

export type HomeConversation = {
  id: string;
  other: PublicUser | null;
};

export function useHome() {
  const { data: friends } = useFriends();
  const { data: dms } = useDms();
  const openDm = useOpenDm();
  const [active, setActive] = useState<HomeConversation | null>(null);

  return {
    friends: friends ?? { friends: [], incoming: [], outgoing: [] },
    dms: dms ?? [],
    active,
    openWith: async (user: PublicUser) => {
      const conv = await openDm.mutateAsync(user.id);
      setActive({ id: conv.id, other: conv.other });
    },
    openWithId: async (userId: string) => {
      const conv = await openDm.mutateAsync(userId);
      setActive({ id: conv.id, other: conv.other });
    },
    selectConversation: (conv: HomeConversation) => setActive(conv),
    showFriends: () => setActive(null),
  };
}
