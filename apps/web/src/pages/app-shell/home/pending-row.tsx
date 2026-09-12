import { Check, X } from 'lucide-react';
import { Avatar } from '../../../components/avatar';
import { useAcceptFriend } from '../../../hooks/friends/use-accept-friend';
import { useRemoveFriend } from '../../../hooks/friends/use-remove-friend';
import type { FriendEntry } from '../../../types/friend';

type PendingRowProps = {
  entry: FriendEntry;
  incoming: boolean;
};

export function PendingRow({ entry, incoming }: PendingRowProps) {
  const accept = useAcceptFriend();
  const remove = useRemoveFriend();

  return (
    <div className="friend-row">
      <Avatar
        name={entry.user.displayName}
        avatarUrl={entry.user.avatarUrl}
        size={36}
      />
      <div className="friend-row-meta">
        <span className="friend-row-name">{entry.user.displayName}</span>
        <span className="friend-row-sub">
          {incoming ? 'Incoming Request' : 'Outgoing Request'}
        </span>
      </div>
      <div className="friend-row-actions">
        {incoming && (
          <button
            className="friend-icon-btn friend-icon-accept"
            title="Accept"
            onClick={() => accept.mutate(entry.friendshipId)}
            disabled={accept.isPending}
          >
            <Check size={18} />
          </button>
        )}
        <button
          className="friend-icon-btn friend-icon-danger"
          title={incoming ? 'Ignore' : 'Cancel'}
          onClick={() => remove.mutate(entry.friendshipId)}
          disabled={remove.isPending}
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}
