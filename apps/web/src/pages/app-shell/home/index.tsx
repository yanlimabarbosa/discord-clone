import { useEffect } from 'react';
import { useHome } from './use-home';
import { DmSidebar } from './dm-sidebar';
import { FriendsPanel } from './friends-panel';
import { DmView } from './dm-view';
import type { PublicUser } from '../../../types/user';
import './home.css';

type HomeProps = {
  user: PublicUser | null | undefined;
  pendingDmUserId?: string | null;
  onPendingDmConsumed?: () => void;
};

export function Home({
  user,
  pendingDmUserId,
  onPendingDmConsumed,
}: HomeProps) {
  const home = useHome();
  const { openWithId } = home;

  useEffect(() => {
    if (!pendingDmUserId) return;
    openWithId(pendingDmUserId).finally(() => onPendingDmConsumed?.());
  }, [pendingDmUserId, openWithId, onPendingDmConsumed]);

  return (
    <>
      <DmSidebar
        dms={home.dms}
        loading={home.dmsLoading}
        activeId={home.active?.id ?? null}
        onSelect={home.selectConversation}
        onFriends={home.showFriends}
        friendsActive={!home.active}
      />
      {home.active ? (
        <DmView conversation={home.active} currentUserId={user?.id ?? ''} />
      ) : (
        <FriendsPanel
          friends={home.friends}
          loading={home.friendsLoading}
          onOpenDm={home.openWith}
        />
      )}
    </>
  );
}
