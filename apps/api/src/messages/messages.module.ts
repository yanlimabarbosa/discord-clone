import { Module } from '@nestjs/common';
import { ServersModule } from '../servers/servers.module';
import { GatewayModule } from '../gateway/gateway.module';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';

@Module({
  imports: [ServersModule, GatewayModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
