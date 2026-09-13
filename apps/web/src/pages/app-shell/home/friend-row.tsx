import { MessageCircle, UserMinus } from 'lucide-react';
import { Avatar } from '../../../components/avatar';
import { Tooltip } from '../../../components/tooltip';
import { useRemoveFriend } from '../../../hooks/friends/use-remove-friend';
import type { FriendEntry } from '../../../types/friend';

type FriendRowProps = {
  entry: FriendEntry;
  onMessage: () => void;
};

export function FriendRow({ entry, onMessage }: FriendRowProps) {
  const removeFriend = useRemoveFriend();

  return (
    <div className="friend-row">
      <Avatar
        name={entry.user.displayName}
        avatarUrl={entry.user.avatarUrl}
        size={36}
      />
      <div className="friend-row-meta">
        <span className="friend-row-name">{entry.user.displayName}</span>
        {entry.user.username && (
          <span className="friend-row-sub">@{entry.user.username}</span>
        )}
      </div>
      <div className="friend-row-actions">
        <Tooltip label="Message">
          <button
            className="friend-icon-btn"
            aria-label="Message"
            onClick={onMessage}
          >
            <MessageCircle size={18} />
          </button>
        </Tooltip>
        <Tooltip label="Remove friend">
          <button
            className="friend-icon-btn friend-icon-danger"
            aria-label="Remove friend"
            onClick={() => removeFriend.mutate(entry.friendshipId)}
            disabled={removeFriend.isPending}
          >
            <UserMinus size={18} />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
