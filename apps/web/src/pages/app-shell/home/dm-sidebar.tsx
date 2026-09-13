import { useEffect, useSyncExternalStore } from 'react';
import { Users } from 'lucide-react';
import { Avatar } from '../../../components/avatar';
import { dmReadStore } from '../../../lib/dm-read-store';
import { SkeletonRows } from '../skeleton-rows';
import type { DmSummary } from '../../../types/dm';
import type { HomeConversation } from './use-home';
import './dm-unread.css';

type DmSidebarProps = {
  dms: DmSummary[];
  loading: boolean;
  activeId: string | null;
  friendsActive: boolean;
  onSelect: (conv: HomeConversation) => void;
  onFriends: () => void;
};

export function DmSidebar({
  dms,
  loading,
  activeId,
  friendsActive,
  onSelect,
  onFriends,
}: DmSidebarProps) {
  const seen = useSyncExternalStore(
    dmReadStore.subscribe,
    dmReadStore.getSnapshot,
  );

  // First sighting of a conversation seeds the store (no false unread on a
  // fresh browser); the open conversation is kept marked as seen.
  useEffect(() => {
    for (const dm of dms) {
      if (seen[dm.id] === undefined || dm.id === activeId) {
        dmReadStore.markSeen(dm.id, dm.lastMessage);
      }
    }
  }, [dms, activeId, seen]);

  return (
    <aside className="sidebar home-sidebar">
      <div className="sidebar-header home-sidebar-header">Home</div>
      <div className="home-sidebar-body">
        <button
          className={`home-friends-btn ${friendsActive ? 'home-friends-btn-active' : ''}`}
          onClick={onFriends}
        >
          <Users size={20} />
          <span>Friends</span>
        </button>

        <div className="home-dm-label">Direct Messages</div>
        {loading && <SkeletonRows rows={5} avatar />}
        {!loading && dms.length === 0 && (
          <div className="home-dm-empty">No conversations yet</div>
        )}
        {!loading &&
          dms.map((dm) => {
            const unread =
              dm.id !== activeId &&
              dmReadStore.isUnread(dm.id, dm.lastMessage);
            return (
              <button
                key={dm.id}
                className={`home-dm-row ${dm.id === activeId ? 'home-dm-row-active' : ''} ${unread ? 'home-dm-row-unread' : ''}`}
                onClick={() => {
                  dmReadStore.markSeen(dm.id, dm.lastMessage);
                  onSelect({ id: dm.id, other: dm.other });
                }}
              >
                <Avatar
                  name={dm.other?.displayName ?? '?'}
                  avatarUrl={dm.other?.avatarUrl}
                  size={32}
                />
                <div className="home-dm-meta">
                  <span className="home-dm-name">
                    {dm.other?.displayName ?? 'Unknown'}
                  </span>
                  {dm.lastMessage && (
                    <span className="home-dm-last">{dm.lastMessage}</span>
                  )}
                </div>
                {unread && <span className="home-dm-unread-dot" />}
              </button>
            );
          })}
      </div>
    </aside>
  );
}
