export type MessageAuthor = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type MessageReaction = {
  emoji: string;
  userId: string;
};

export type MessageReplyTo = {
  id: string;
  content: string;
  author: { displayName: string };
};

export type Message = {
  id: string;
  channelId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  author: MessageAuthor;
  reactions: MessageReaction[];
  replyTo: MessageReplyTo | null;
  pending?: boolean;
};
