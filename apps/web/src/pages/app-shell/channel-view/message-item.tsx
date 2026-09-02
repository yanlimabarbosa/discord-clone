import { useEffect, useRef, useState, KeyboardEvent } from 'react';
import { SmilePlus, Reply, Pencil, Trash2 } from 'lucide-react';
import type { Message } from '../../../types/message';
import { Avatar } from '../../../components/avatar';
import { ProfileCard } from '../profile-card';
import { useMe } from '../../../hooks/auth/use-me';
import { useEditMessage } from '../../../hooks/messages/use-edit-message';
import { useDeleteMessage } from '../../../hooks/messages/use-delete-message';
import { useToggleReaction } from '../../../hooks/messages/use-toggle-reaction';
import './message-extras.css';

type MessageItemProps = {
  message: Message;
  onReply: (message: Message) => void;
};

const QUICK_EMOJIS = ['👍', '❤️', '😂', '🎉', '😮', '😢', '🔥', '👀'];

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

export function MessageItem({ message, onReply }: MessageItemProps) {
  const time = formatTime(message.createdAt);
  const [showProfile, setShowProfile] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(message.content);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { data: me } = useMe();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const toggleReaction = useToggleReaction();

  const isMine = me?.id === message.author.id;
  const groups = groupReactions(message.reactions, me?.id);
  const isImage = !!message.attachmentUrl && message.attachmentType?.startsWith('image');

  useEffect(() => {
    if (!showPicker) return;
    function onDocClick(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showPicker]);

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

  function pickEmoji(emoji: string) {
    toggleReaction.mutate({ id: message.id, emoji });
    setShowPicker(false);
  }

  return (
    <div className="message">
      <div className="message-toolbar">
        <div className="emoji-picker-wrap" ref={pickerRef}>
          <button
            type="button"
            className="message-toolbar-btn"
            title="Add reaction"
            onClick={() => setShowPicker((v) => !v)}
          >
            <SmilePlus size={18} />
          </button>
          {showPicker && (
            <div className="emoji-picker">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="emoji-picker-btn"
                  onClick={() => pickEmoji(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          className="message-toolbar-btn"
          title="Reply"
          onClick={() => onReply(message)}
        >
          <Reply size={18} />
        </button>
        {isMine && (
          <>
            <button
              type="button"
              className="message-toolbar-btn"
              title="Edit"
              onClick={startEdit}
            >
              <Pencil size={18} />
            </button>
            <button
              type="button"
              className="message-toolbar-btn is-danger"
              title="Delete"
              onClick={() => deleteMessage.mutate(message.id)}
            >
              <Trash2 size={18} />
            </button>
          </>
        )}
      </div>

      <div
        className="message-avatar"
        style={{ cursor: 'pointer' }}
        onClick={() => setShowProfile(true)}
      >
        <Avatar
          name={message.author.displayName}
          avatarUrl={message.author.avatarUrl}
          size={40}
        />
      </div>
      <div className="message-body">
        {message.replyTo && (
          <div className="message-reply-preview">
            <span>↳ replying to</span>
            <span className="reply-author">
              {message.replyTo.author.displayName}
            </span>
            <span className="reply-snippet">: {message.replyTo.content}</span>
          </div>
        )}
        <div className="message-meta">
          <span
            className="message-author"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowProfile(true)}
          >
            {message.author.displayName}
          </span>
          <span className="message-time">{time}</span>
        </div>

        {isEditing ? (
          <div>
            <textarea
              className="message-edit-input"
              rows={1}
              value={draft}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onEditKeyDown}
            />
            <div className="message-edit-hint">
              escape to cancel • enter to save
            </div>
          </div>
        ) : (
          <div className="message-content">
            {message.content}
            {message.editedAt && (
              <span className="message-edited">(edited)</span>
            )}
          </div>
        )}

        {isImage && (
          <div className="message-attachment">
            <img src={message.attachmentUrl!} alt="attachment" />
          </div>
        )}

        {groups.length > 0 && (
          <div className="message-reactions">
            {groups.map((g) => (
              <button
                key={g.emoji}
                type="button"
                className={`reaction-pill${g.mine ? ' is-mine' : ''}`}
                onClick={() =>
                  toggleReaction.mutate({ id: message.id, emoji: g.emoji })
                }
              >
                <span>{g.emoji}</span>
                <span className="reaction-count">{g.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

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
    </div>
  );
}
