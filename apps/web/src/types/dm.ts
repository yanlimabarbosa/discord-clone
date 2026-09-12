import type { PublicUser } from './user';

export type DmSummary = {
  id: string;
  other: PublicUser | null;
  lastMessage: string | null;
};

export type DmConversation = {
  id: string;
  other: PublicUser | null;
};

export type DmMessage = {
  id: string;
  conversationId: string;
  content: string;
  createdAt: string;
  editedAt: string | null;
  attachmentUrl: string | null;
  attachmentType: string | null;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
};
