import { useEffect, useRef } from 'react';
import { Avatar } from '../../../components/avatar';
import { useDmMessages } from '../../../hooks/dms/use-dm-messages';
import { useDmRealtime } from '../../../hooks/dms/use-dm-realtime';
import { useSendDm } from '../../../hooks/dms/use-send-dm';
import { DmComposer } from './dm-composer';
import type { HomeConversation } from './use-home';

type DmViewProps = {
  conversation: HomeConversation;
  currentUserId: string;
};

export function DmView({ conversation, currentUserId }: DmViewProps) {
  const { data: messages, isLoading } = useDmMessages(conversation.id);
  useDmRealtime(conversation.id);
  const sendDm = useSendDm(conversation.id);
  const bottomRef = useRef<HTMLDivElement>(null);
  const name = conversation.other?.displayName ?? 'Unknown';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
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

      <div className="dm-messages">
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
        {messages?.map((m) => (
          <div
            key={m.id}
            className={`dm-msg ${m.author.id === currentUserId ? 'dm-msg-own' : ''}`}
          >
            <Avatar
              name={m.author.displayName}
              avatarUrl={m.author.avatarUrl}
              size={38}
            />
            <div className="dm-msg-body">
              <div className="dm-msg-head">
                <span className="dm-msg-author">{m.author.displayName}</span>
                <span className="dm-msg-time">
                  {new Date(m.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {m.content && <div className="dm-msg-text">{m.content}</div>}
              {m.attachmentUrl &&
                m.attachmentType?.startsWith('image') && (
                  <a
                    className="dm-msg-attachment"
                    href={m.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={m.attachmentUrl} alt="attachment" />
                  </a>
                )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <DmComposer
        name={name}
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
