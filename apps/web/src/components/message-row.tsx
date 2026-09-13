import { useMemo, type ReactNode } from 'react';
import { Avatar } from './avatar';
import { MessageMarkdown } from './message-markdown';
import { MessageAttachment } from './message-attachment';
import { formatFullTimestamp, formatTimeOnly } from '../lib/message-time';
import './message-row.css';

export type MessageRowAuthor = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

type MessageRowProps = {
  domId?: string;
  author: MessageRowAuthor;
  createdAt: string;
  editedAt?: string | null;
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  compact?: boolean;
  pending?: boolean;
  mentioned?: boolean;
  authorColor?: string;
  memberNames?: readonly string[];
  onAuthorClick?: () => void;
  replyPreview?: ReactNode;
  contentOverride?: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
};

export function MessageRow({
  domId,
  author,
  createdAt,
  editedAt,
  content,
  attachmentUrl,
  attachmentType,
  compact = false,
  pending = false,
  mentioned = false,
  authorColor,
  memberNames,
  onAuthorClick,
  replyPreview,
  contentOverride,
  toolbar,
  footer,
}: MessageRowProps) {
  const timestamp = useMemo(
    () => (compact ? formatTimeOnly(createdAt) : formatFullTimestamp(createdAt)),
    [compact, createdAt],
  );
  const isImage = !!attachmentUrl && !!attachmentType?.startsWith('image');

  const rowClass = [
    'message',
    compact ? 'is-compact' : '',
    pending ? 'message-pending' : '',
    mentioned ? 'is-mention' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div id={domId} className={rowClass}>
      {toolbar}
      {compact ? (
        <div className="message-gutter" aria-hidden="true">
          <span className="message-gutter-time">{timestamp}</span>
        </div>
      ) : (
        <div
          className="message-avatar"
          style={onAuthorClick ? { cursor: 'pointer' } : undefined}
          onClick={onAuthorClick}
        >
          <Avatar
            name={author.displayName}
            avatarUrl={author.avatarUrl}
            size={40}
          />
        </div>
      )}
      <div className="message-body">
        {replyPreview}
        {!compact && (
          <div className="message-meta">
            <span
              className="message-author"
              style={{
                ...(onAuthorClick ? { cursor: 'pointer' } : null),
                ...(authorColor ? { color: authorColor } : null),
              }}
              onClick={onAuthorClick}
            >
              {author.displayName}
            </span>
            <span className="message-time">{timestamp}</span>
          </div>
        )}
        {contentOverride ??
          (content ? (
            <div className="message-content">
              <MessageMarkdown content={content} memberNames={memberNames} />
              {editedAt && <span className="message-edited">(edited)</span>}
            </div>
          ) : null)}
        {isImage && <MessageAttachment url={attachmentUrl!} />}
        {footer}
      </div>
    </div>
  );
}
