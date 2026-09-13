import {
  Fragment,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { ArrowDown } from 'lucide-react';
import type { Message } from '../../../types/message';
import { MessageItem } from './message-item';
import { MessageSkeleton } from './message-skeleton';
import { TypingIndicator } from './typing-indicator';
import { MessageDayDivider } from '../../../components/message-day-divider';
import { buildChatItems } from '../../../lib/chat-items';
import { useMe } from '../../../hooks/auth/use-me';
import { useMembers } from '../../../hooks/members/use-members';
import { useRoles } from '../../../hooks/roles/use-roles';
import './message-extras.css';

type MessageListProps = {
  messages: Message[];
  loading: boolean;
  channelName: string;
  channelId: string;
  serverId: string | null;
  onReply: (message: Message) => void;
};

const NEAR_BOTTOM_PX = 120;
const JUMP_THRESHOLD_PX = 300;

export function MessageList({
  messages,
  loading,
  channelName,
  channelId,
  serverId,
  onReply,
}: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollTickRef = useRef(false);
  const [showJump, setShowJump] = useState(false);

  const { data: me } = useMe();
  const { data: members } = useMembers(serverId);
  const { data: roles } = useRoles(serverId);

  const memberNames = useMemo(
    () => (members ?? []).map((m) => m.displayName),
    [members],
  );

  const roleColorByUser = useMemo(() => {
    const map = new Map<string, string>();
    if (!roles) return map;
    const sorted = [...roles].sort((a, b) => b.position - a.position);
    for (const role of sorted) {
      if (!role.color) continue;
      for (const assignment of role.assignments) {
        if (!map.has(assignment.userId)) {
          map.set(assignment.userId, role.color);
        }
      }
    }
    return map;
  }, [roles]);

  const items = useMemo(() => buildChatItems(messages), [messages]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    setShowJump(false);
  }, [channelId]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  function onScroll() {
    if (scrollTickRef.current) return;
    scrollTickRef.current = true;
    requestAnimationFrame(() => {
      scrollTickRef.current = false;
      const list = listRef.current;
      if (!list) return;
      const distance =
        list.scrollHeight - list.scrollTop - list.clientHeight;
      setShowJump(distance > JUMP_THRESHOLD_PX);
    });
  }

  const showWelcome = !loading && messages.length === 0;

  return (
    <div className="message-scroll-region">
      <div className="message-list" ref={listRef} onScroll={onScroll}>
        {loading ? (
          <MessageSkeleton />
        ) : (
          <>
            {showWelcome && (
              <div className="message-welcome">
                <div className="content-empty-logo">#</div>
                <h3>Welcome to #{channelName}</h3>
                <p>This is the start of the channel.</p>
              </div>
            )}
            {items.map(({ message, compact, dayLabel }) => (
              <Fragment key={message.id}>
                {dayLabel && <MessageDayDivider label={dayLabel} />}
                <MessageItem
                  message={message}
                  compact={compact}
                  myId={me?.id}
                  myName={me?.displayName}
                  memberNames={memberNames}
                  authorColor={roleColorByUser.get(message.author.id)}
                  onReply={onReply}
                />
              </Fragment>
            ))}
          </>
        )}
        <TypingIndicator channelId={channelId} />
        <div ref={bottomRef} />
      </div>
      {showJump && (
        <button
          type="button"
          className="jump-to-present"
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' })}
        >
          Jump to present
          <ArrowDown size={14} />
        </button>
      )}
    </div>
  );
}
