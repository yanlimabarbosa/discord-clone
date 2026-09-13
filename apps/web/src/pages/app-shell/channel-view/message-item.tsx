import { memo, useMemo, useState, type KeyboardEvent } from 'react';
import { SmilePlus, Reply, Pencil, Trash2 } from 'lucide-react';
import type { Message } from '../../../types/message';
import { MessageRow } from '../../../components/message-row';
import { EmojiPickerButton } from '../../../components/emoji-picker-button';
import { Tooltip } from '../../../components/tooltip';
import { ProfileCard } from '../profile-card';
import { useEditMessage } from '../../../hooks/messages/use-edit-message';
import { useDeleteMessage } from '../../../hooks/messages/use-delete-message';
import { useToggleReaction } from '../../../hooks/messages/use-toggle-reaction';
import { mentionsUser } from '../../../lib/message-mentions';
import { jumpToMessage, messageDomId } from '../../../lib/jump-to-message';
import './message-extras.css';

type MessageItemProps = {
  message: Message;
  compact: boolean;
  myId: string | undefined;
  myName: string | undefined;
  memberNames: readonly string[];
  authorColor: string | undefined;
  onReply: (message: Message) => void;
};

type ReactionGroup = {
  emoji: string;
  count: number;
  mine: boolean;
};

function groupReactions(
  reactions: Message['reactions'],
  myId: string | undefined,
): ReactionGroup[] {
  const map = new Map<string, ReactionGroup>();
  for (const r of reactions) {
    const existing = map.get(r.emoji);
    if (existing) {
      existing.count += 1;
      if (r.userId === myId) existing.mine = true;
    } else {
      map.set(r.emoji, {
        emoji: r.emoji,
        count: 1,
        mine: r.userId === myId,
      });
    }
  }
  return Array.from(map.values());
}

export const MessageItem = memo(function MessageItem({
  message,
  compact,
  myId,
  myName,
  memberNames,
  authorColor,
  onReply,
}: MessageItemProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const editMessage = useEditMessage(message.channelId);
  const deleteMessage = useDeleteMessage(message.channelId);
  const toggleReaction = useToggleReaction(message.channelId);

  const isMine = myId === message.author.id;
  const groups = useMemo(
    () => groupReactions(message.reactions, myId),
    [message.reactions, myId],
  );
  const mentioned = useMemo(
    () => mentionsUser(message.content, myName),
    [message.content, myName],
  );

  function startEdit() {
    setDraft(message.content);
    setIsEditing(true);
  }

  function saveEdit() {
    const content = draft.trim();
    if (!content || content === message.content) {
      setIsEditing(false);
      return;
    }
    editMessage.mutate({ id: message.id, content });
    setIsEditing(false);
  }

  function onEditKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditing(false);
    }
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      window.setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteMessage.mutate(message.id);
  }

  const toolbar = (
    <div className="message-toolbar">
      <EmojiPickerButton
        label="Add reaction"
        icon={<SmilePlus size={18} />}
        buttonClassName="message-toolbar-btn"
        onPick={(emoji) => toggleReaction.mutate({ id: message.id, emoji })}
      />
      <Tooltip label="Reply">
        <button
          type="button"
          className="message-toolbar-btn"
          aria-label="Reply to message"
          onClick={() => onReply(message)}
        >
          <Reply size={18} />
        </button>
      </Tooltip>
      {isMine && (
        <>
          <Tooltip label="Edit">
            <button
              type="button"
              className="message-toolbar-btn"
              aria-label="Edit message"
              onClick={startEdit}
            >
              <Pencil size={18} />
            </button>
          </Tooltip>
          <Tooltip label={confirmDelete ? 'Click again to delete' : 'Delete'}>
            <button
              type="button"
              className={`message-toolbar-btn is-danger${confirmDelete ? ' is-confirming' : ''}`}
              aria-label={
                confirmDelete ? 'Confirm delete message' : 'Delete message'
              }
              onClick={handleDelete}
            >
              <Trash2 size={18} />
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );

  const replyPreview = message.replyTo ? (
    <button
      type="button"
      className="message-reply-preview"
      onClick={() => jumpToMessage(message.replyTo!.id)}
    >
      <span>↳ replying to</span>
      <span className="reply-author">{message.replyTo.author.displayName}</span>
      <span className="reply-snippet">: {message.replyTo.content}</span>
    </button>
  ) : undefined;

  const contentOverride = isEditing ? (
    <div>
      <textarea
        className="message-edit-input"
        rows={1}
        value={draft}
        autoFocus
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onEditKeyDown}
      />
      <div className="message-edit-hint">escape to cancel • enter to save</div>
    </div>
  ) : undefined;

  const reactions =
    groups.length > 0 ? (
      <div className="message-reactions">
        {groups.map((g) => (
          <button
            key={g.emoji}
            type="button"
            className={`reaction-pill${g.mine ? ' is-mine' : ''}`}
            aria-label={`${g.emoji} reaction, ${g.count}. Toggle your reaction`}
            aria-pressed={g.mine}
            onClick={() =>
              toggleReaction.mutate({ id: message.id, emoji: g.emoji })
            }
          >
            <span>{g.emoji}</span>
            <span className="reaction-count">{g.count}</span>
          </button>
        ))}
      </div>
    ) : undefined;

  return (
    <>
      <MessageRow
        domId={messageDomId(message.id)}
        author={message.author}
        createdAt={message.createdAt}
        editedAt={message.editedAt}
        content={message.content}
        attachmentUrl={message.attachmentUrl}
        attachmentType={message.attachmentType}
        compact={compact}
        pending={message.pending}
        mentioned={mentioned}
        authorColor={authorColor}
        memberNames={memberNames}
        onAuthorClick={() => setShowProfile(true)}
        replyPreview={replyPreview}
        contentOverride={contentOverride}
        toolbar={toolbar}
        footer={reactions}
      />
      {showProfile && (
        <ProfileCard
          user={{
            id: message.author.id,
            displayName: message.author.displayName,
            avatarUrl: message.author.avatarUrl,
          }}
          onClose={() => setShowProfile(false)}
        />
      )}
    </>
  );
});
