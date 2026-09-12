import { Users } from 'lucide-react';
import { Avatar } from '../../../components/avatar';
import type { DmSummary } from '../../../types/dm';
import type { HomeConversation } from './use-home';

type DmSidebarProps = {
  dms: DmSummary[];
  activeId: string | null;
  friendsActive: boolean;
  onSelect: (conv: HomeConversation) => void;
  onFriends: () => void;
};

export function DmSidebar({
  dms,
  activeId,
  friendsActive,
  onSelect,
  onFriends,
}: DmSidebarProps) {
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
        {dms.length === 0 && (
          <div className="home-dm-empty">No conversations yet</div>
        )}
        {dms.map((dm) => (
          <button
            key={dm.id}
            className={`home-dm-row ${dm.id === activeId ? 'home-dm-row-active' : ''}`}
            onClick={() => onSelect({ id: dm.id, other: dm.other })}
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
          </button>
        ))}
      </div>
    </aside>
  );
}
