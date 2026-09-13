import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { AddFriendForm } from './add-friend-form';
import { SkeletonRows } from '../skeleton-rows';
import { FriendRow } from './friend-row';
import { PendingRow } from './pending-row';
import type { FriendsData } from '../../../types/friend';
import type { PublicUser } from '../../../types/user';

type FriendsTab = 'all' | 'pending' | 'add';

type FriendsPanelProps = {
  friends: FriendsData;
  loading: boolean;
  onOpenDm: (user: PublicUser) => void;
};

export function FriendsPanel({ friends, loading, onOpenDm }: FriendsPanelProps) {
  const [tab, setTab] = useState<FriendsTab>('all');
  const pendingCount = friends.incoming.length;

  return (
    <main className="content home-content">
      <header className="home-friends-toolbar">
        <div className="home-friends-title">
          <Users size={20} />
          <span>Friends</span>
        </div>
        <div className="home-friends-tabs">
          <button
            className={`home-tab ${tab === 'all' ? 'home-tab-active' : ''}`}
            onClick={() => setTab('all')}
          >
            All
          </button>
          <button
            className={`home-tab ${tab === 'pending' ? 'home-tab-active' : ''}`}
            onClick={() => setTab('pending')}
          >
            Pending
            {pendingCount > 0 && (
              <span className="home-tab-badge">{pendingCount}</span>
            )}
          </button>
          <button
            className={`home-tab home-tab-add ${tab === 'add' ? 'home-tab-active' : ''}`}
            onClick={() => setTab('add')}
          >
            <UserPlus size={16} />
            Add Friend
          </button>
        </div>
      </header>

      <div className="home-friends-body">
        {tab === 'add' && <AddFriendForm />}

        {tab === 'all' &&
          (loading ? (
            <SkeletonRows rows={5} avatar />
          ) : (
            <>
              <div className="home-list-label">
                All Friends — {friends.friends.length}
              </div>
              {friends.friends.length === 0 ? (
                <div className="home-friends-empty">
                  No friends yet. Add someone by their username.
                </div>
              ) : (
                friends.friends.map((f) => (
                  <FriendRow
                    key={f.friendshipId}
                    entry={f}
                    onMessage={() => onOpenDm(f.user)}
                  />
                ))
              )}
            </>
          ))}

        {tab === 'pending' &&
          (loading ? (
            <SkeletonRows rows={4} avatar />
          ) : (
          <>
            <div className="home-list-label">
              Incoming — {friends.incoming.length}
            </div>
            {friends.incoming.map((f) => (
              <PendingRow key={f.friendshipId} entry={f} incoming />
            ))}
            <div className="home-list-label">
              Outgoing — {friends.outgoing.length}
            </div>
            {friends.outgoing.map((f) => (
              <PendingRow key={f.friendshipId} entry={f} incoming={false} />
            ))}
            {friends.incoming.length === 0 &&
              friends.outgoing.length === 0 && (
                <div className="home-friends-empty">No pending requests.</div>
              )}
          </>
          ))}
      </div>
    </main>
  );
}
