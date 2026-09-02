import { User } from '@prisma/client';

export type PublicUser = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  isGuest: boolean;
  username: string | null;
};

// Strips secrets (passwordHash, email, googleId) before sending a user to clients.
export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    isGuest: user.isGuest,
    username: user.username,
  };
}
