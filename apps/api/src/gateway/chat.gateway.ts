import {
  OnGatewayConnection,
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

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class ChatGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

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
  }

  @SubscribeMessage('channel.join')
  onJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    if (body?.channelId) client.join(body.channelId);
  }

  @SubscribeMessage('channel.leave')
  onLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    if (body?.channelId) client.leave(body.channelId);
  }

  @SubscribeMessage('typing.start')
  onTypingStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    this.emitTyping(client, body?.channelId, true);
  }

  @SubscribeMessage('typing.stop')
  onTypingStop(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { channelId: string },
  ) {
    this.emitTyping(client, body?.channelId, false);
  }

  broadcastMessage(channelId: string, message: unknown) {
    this.server.to(channelId).emit('message.new', message);
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
