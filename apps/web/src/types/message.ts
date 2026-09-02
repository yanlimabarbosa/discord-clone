export type MessageAuthor = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
};

export type Message = {
  id: string;
  channelId: string;
  content: string;
  createdAt: string;
  author: MessageAuthor;
};
