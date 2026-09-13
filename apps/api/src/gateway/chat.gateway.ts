import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as cookie from 'cookie';
import { AuthService } from '../auth/auth.service';
import { SESSION_COOKIE } from '../auth/jwt-cookie.guard';
import {
  applyWatchAction,
  emptyWatchState,
  liveWatchState,
  WatchAction,
  WatchState,
} from './watch-state';

export type Presence = { online: boolean; voiceChannelId: string | null };

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private onlineCounts = new Map<string, number>();
  private voiceByUser = new Map<string, string>();
  private watchByChannel = new Map<string, WatchState>();

  constructor(private readonly auth: AuthService) {}

  async handleConnection(client: Socket) {
    const cookies = cookie.parse(client.handshake.headers.cookie ?? '');
    const token = cookies[SESSION_COOKIE];
    const user = token ? await this.auth.userFromToken(token) : null;
    if (!user) {
      client.disconnect();
      return;
    }
    client.data.user = { id: user.id, displayName: user.displayName };
    // Per-user room: lets services target all of a user's sockets directly
    // (friend updates, DM activity) without a userId→socket map.
    client.join(`user:${user.id}`);
    const next = (this.onlineCounts.get(user.id) ?? 0) + 1;
    this.onlineCounts.set(user.id, next);
    if (next === 1) this.broadcastPresence(user.id);
  }

  handleDisconnect(client: Socket) {
    const user = client.data.user;
    if (!user) return;
    const next = (this.onlineCounts.get(user.id) ?? 1) - 1;
    if (next <= 0) {
      this.onlineCounts.delete(user.id);
      this.voiceByUser.delete(user.id);
      this.broadcastPresence(user.id);
    } else {
      this.onlineCounts.set(user.id, next);
    }
  }

  @SubscribeMessage('channel.join')
  onJoin(@ConnectedSocket() c: Socket, @MessageBody() b: { channelId: string }) {
    if (b?.channelId) c.join(b.channelId);
  }

  @SubscribeMessage('channel.leave')
  onLeave(@ConnectedSocket() c: Socket, @MessageBody() b: { channelId: string }) {
    if (b?.channelId) c.leave(b.channelId);
  }

  @SubscribeMessage('dm.join')
  onDmJoin(@ConnectedSocket() c: Socket, @MessageBody() b: { conversationId: string }) {
    if (b?.conversationId) c.join(`dm:${b.conversationId}`);
  }

  @SubscribeMessage('dm.leave')
  onDmLeave(@ConnectedSocket() c: Socket, @MessageBody() b: { conversationId: string }) {
    if (b?.conversationId) c.leave(`dm:${b.conversationId}`);
  }

  @SubscribeMessage('server.join')
  onServerJoin(
    @ConnectedSocket() c: Socket,
    @MessageBody() b: { serverId: string },
  ) {
    if (b?.serverId) c.join(`server:${b.serverId}`);
  }

  @SubscribeMessage('server.leave')
  onServerLeave(
    @ConnectedSocket() c: Socket,
    @MessageBody() b: { serverId: string },
  ) {
    if (b?.serverId) c.leave(`server:${b.serverId}`);
  }

  @SubscribeMessage('voice.join')
  onVoiceJoin(
    @ConnectedSocket() c: Socket,
    @MessageBody() b: { channelId: string },
  ) {
    const user = c.data.user;
    if (user && b?.channelId) {
      this.voiceByUser.set(user.id, b.channelId);
      this.broadcastPresence(user.id);
    }
  }

  @SubscribeMessage('voice.leave')
  onVoiceLeave(@ConnectedSocket() c: Socket) {
    const user = c.data.user;
    if (user) {
      this.voiceByUser.delete(user.id);
      this.broadcastPresence(user.id);
    }
  }

  @SubscribeMessage('voice.speaking')
  onSpeaking(
    @ConnectedSocket() c: Socket,
    @MessageBody() b: { speaking: boolean },
  ) {
    const user = c.data.user;
    if (!user) return;
    const channelId = this.voiceByUser.get(user.id) ?? null;
    this.server.emit('voice.speaking', {
      userId: user.id,
      channelId,
      speaking: !!b?.speaking,
    });
  }

  @SubscribeMessage('voice.mute')
  onMute(@ConnectedSocket() c: Socket, @MessageBody() b: { muted: boolean }) {
    const user = c.data.user;
    if (!user) return;
    this.server.emit('voice.mute', { userId: user.id, muted: !!b?.muted });
  }

  @SubscribeMessage('voice.deafen')
  onDeafen(
    @ConnectedSocket() c: Socket,
    @MessageBody() b: { deafened: boolean },
  ) {
    const user = c.data.user;
    if (!user) return;
    this.server.emit('voice.deafen', {
      userId: user.id,
      deafened: !!b?.deafened,
    });
  }

  @SubscribeMessage('watch.join')
  onWatchJoin(
    @ConnectedSocket() c: Socket,
    @MessageBody() b: { channelId: string },
  ) {
    if (!b?.channelId) return;
    c.join(`watch:${b.channelId}`);
    const state = this.watchByChannel.get(b.channelId) ?? emptyWatchState();
    c.emit('watch.state', {
      channelId: b.channelId,
      state: liveWatchState(state, Date.now()),
    });
  }

  @SubscribeMessage('watch.leave')
  onWatchLeave(
    @ConnectedSocket() c: Socket,
    @MessageBody() b: { channelId: string },
  ) {
    if (b?.channelId) c.leave(`watch:${b.channelId}`);
  }

  @SubscribeMessage('watch.control')
  onWatchControl(
    @ConnectedSocket() c: Socket,
    @MessageBody() b: { channelId: string; action: WatchAction },
  ) {
    if (!c.data.user || !b?.channelId || !b.action) return;
    const now = Date.now();
    const prev = this.watchByChannel.get(b.channelId) ?? emptyWatchState();
    // Debounce auto-advance so N clients firing "ended" don't skip N tracks.
    if (
      (b.action.type === 'ended' || b.action.type === 'next') &&
      now - prev.updatedAtMs < 1200
    ) {
      return;
    }
    const next = applyWatchAction(prev, b.action, now);
    this.watchByChannel.set(b.channelId, next);
    this.server
      .to(`watch:${b.channelId}`)
      .emit('watch.state', { channelId: b.channelId, state: next });
  }

  @SubscribeMessage('typing.start')
  onTypingStart(@ConnectedSocket() c: Socket, @MessageBody() b: { channelId: string }) {
    this.emitTyping(c, b?.channelId, true);
  }

  @SubscribeMessage('typing.stop')
  onTypingStop(@ConnectedSocket() c: Socket, @MessageBody() b: { channelId: string }) {
    this.emitTyping(c, b?.channelId, false);
  }

  broadcastMessage(channelId: string, message: unknown) {
    this.server.to(channelId).emit('message.new', message);
  }

  broadcastMessageUpdate(channelId: string, message: unknown) {
    this.server.to(channelId).emit('message.update', message);
  }

  broadcastMessageDelete(channelId: string, messageId: string) {
    this.server.to(channelId).emit('message.delete', { id: messageId });
  }

  broadcastDm(conversationId: string, message: unknown) {
    this.server.to(`dm:${conversationId}`).emit('dm.new', message);
  }

  emitFriendUpdate(
    userIds: string[],
    payload: {
      kind: 'request' | 'accepted' | 'removed';
      friendshipId: string;
      requester: unknown;
      addressee: unknown;
    },
  ) {
    for (const userId of userIds) {
      this.server.to(`user:${userId}`).emit('friend.update', payload);
    }
  }

  emitDmActivity(
    userIds: string[],
    payload: { conversationId: string; lastMessage: string; from: unknown },
  ) {
    for (const userId of userIds) {
      this.server.to(`user:${userId}`).emit('dm.activity', payload);
    }
  }

  emitVoiceMoved(payload: {
    userId: string;
    channelId: string;
    serverId: string;
    channelName: string;
    serverName: string;
  }) {
    this.server.emit('voice.moved', payload);
  }

  emitForceMute(userId: string, muted: boolean) {
    this.server.emit('voice.forceMute', { userId, muted });
  }

  emitForceDeafen(userId: string, deafened: boolean) {
    this.server.emit('voice.forceDeafen', { userId, deafened });
  }

  broadcastChannelActivity(
    serverId: string,
    payload: {
      channelId: string;
      serverId: string;
      authorId: string;
      mentionsEveryone: boolean;
      mentionedUserIds: string[];
    },
  ) {
    this.server.to(`server:${serverId}`).emit('channel.activity', payload);
  }

  getPresence(userId: string): Presence {
    return {
      online: this.onlineCounts.has(userId),
      voiceChannelId: this.voiceByUser.get(userId) ?? null,
    };
  }

  private broadcastPresence(userId: string) {
    this.server.emit('presence', { userId, ...this.getPresence(userId) });
  }

  private emitTyping(client: Socket, channelId: string, isTyping: boolean) {
    if (!channelId) return;
    const user = client.data.user;
    client.to(channelId).emit('typing', {
      channelId,
      userId: user.id,
      displayName: user.displayName,
      isTyping,
    });
  }
}
