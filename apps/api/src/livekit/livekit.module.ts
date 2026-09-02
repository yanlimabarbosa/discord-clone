import { Module } from '@nestjs/common';
import { ServersModule } from '../servers/servers.module';
import { LivekitController } from './livekit.controller';
import { LivekitService } from './livekit.service';

@Module({
  imports: [ServersModule],
  controllers: [LivekitController],
  providers: [LivekitService],
})
export class LivekitModule {}
