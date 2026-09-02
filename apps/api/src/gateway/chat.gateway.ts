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

export type Presence = { online: boolean; voiceChannelId: string | null };

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;

  private onlineCounts = new Map<string, number>();
  private voiceByUser = new Map<string, string>();

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
