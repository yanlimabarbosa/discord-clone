export type ChannelUnread = {
  unread: boolean;
  mentions: number;
};

export type ServerUnread = Record<string, ChannelUnread>;

export type UnreadMap = Record<string, ServerUnread>;
