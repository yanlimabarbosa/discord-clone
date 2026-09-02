import { Module } from '@nestjs/common';
import { ServersModule } from '../servers/servers.module';
import { InvitesController } from './invites.controller';
import { InvitesService } from './invites.service';

@Module({
  imports: [ServersModule],
  controllers: [InvitesController],
  providers: [InvitesService],
})
export class InvitesModule {}
