import type { PublicUser } from './user';

export type FriendEntry = {
  friendshipId: string;
  user: PublicUser;
};

export type FriendsData = {
  friends: FriendEntry[];
  incoming: FriendEntry[];
  outgoing: FriendEntry[];
};
