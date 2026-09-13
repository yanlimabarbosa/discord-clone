import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Avatar } from '../../../components/avatar';
import { MessageRow } from '../../../components/message-row';
import { MessageDayDivider } from '../../../components/message-day-divider';
import { useDmMessages } from '../../../hooks/dms/use-dm-messages';
import { useDmRealtime } from '../../../hooks/dms/use-dm-realtime';
import { useSendDm } from '../../../hooks/dms/use-send-dm';
import { useMe } from '../../../hooks/auth/use-me';
import { buildChatItems } from '../../../lib/chat-items';
import { mentionsUser } from '../../../lib/message-mentions';
import { DmComposer } from './dm-composer';
import type { HomeConversation } from './use-home';

type DmViewProps = {
  conversation: HomeConversation;
  currentUserId: string;
};

const NEAR_BOTTOM_PX = 120;

export function DmView({ conversation }: DmViewProps) {
  const { data: messages, isLoading } = useDmMessages(conversation.id);
  useDmRealtime(conversation.id);
  const sendDm = useSendDm(conversation.id);
  const { data: me } = useMe();
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const name = conversation.other?.displayName ?? 'Unknown';

  const memberNames = useMemo(() => {
    const names: string[] = [];
    if (conversation.other?.displayName) {
      names.push(conversation.other.displayName);
    }
    if (me?.displayName) names.push(me.displayName);
    return names;
  }, [conversation.other?.displayName, me?.displayName]);

  const items = useMemo(() => buildChatItems(messages ?? []), [messages]);

  useLayoutEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [conversation.id]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nearBottom =
      list.scrollHeight - list.scrollTop - list.clientHeight < NEAR_BOTTOM_PX;
    if (nearBottom) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages?.length]);

  return (
    <main className="content dm-view">
      <header className="dm-header">
        <Avatar
          name={name}
          avatarUrl={conversation.other?.avatarUrl}
          size={28}
        />
        <span className="dm-header-name">{name}</span>
      </header>

      <div className="dm-messages" ref={listRef}>
        {isLoading && <div className="dm-loading">Loading…</div>}
        {!isLoading && messages?.length === 0 && (
          <div className="dm-intro">
            <Avatar
              name={name}
              avatarUrl={conversation.other?.avatarUrl}
              size={72}
            />
            <h2>{name}</h2>
            <p>This is the beginning of your direct message history.</p>
          </div>
        )}
        {items.map(({ message, compact, dayLabel }) => (
          <Fragment key={message.id}>
            {dayLabel && <MessageDayDivider label={dayLabel} />}
            <MessageRow
              author={message.author}
              createdAt={message.createdAt}
              editedAt={message.editedAt}
              content={message.content}
              attachmentUrl={message.attachmentUrl}
              attachmentType={message.attachmentType}
              compact={compact}
              mentioned={mentionsUser(message.content, me?.displayName)}
              memberNames={memberNames}
            />
          </Fragment>
        ))}
        <div ref={bottomRef} />
      </div>

      <DmComposer
        name={name}
        sending={sendDm.isPending}
        onSend={(content, attachments) => {
          if (attachments.length === 0) {
            sendDm.mutate({ content });
          } else {
            attachments.forEach((a, i) =>
              sendDm.mutate({
                content: i === 0 ? content : '',
                attachmentUrl: a.url,
                attachmentType: a.type,
              }),
            );
          }
        }}
      />
    </main>
  );
}
