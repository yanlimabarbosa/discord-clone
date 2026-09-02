import { Module } from '@nestjs/common';
import { ServersModule } from '../servers/servers.module';
import { GatewayModule } from '../gateway/gateway.module';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

@Module({
  imports: [ServersModule, GatewayModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
