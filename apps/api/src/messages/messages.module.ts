import { Module } from '@nestjs/common';
import { ServersModule } from '../servers/servers.module';
import { GatewayModule } from '../gateway/gateway.module';
import { MessagesController } from './messages.controller';
import { MessageActionsController } from './message-actions.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [ServersModule, GatewayModule],
  controllers: [MessagesController, MessageActionsController],
  providers: [MessagesService],
})
export class MessagesModule {}
