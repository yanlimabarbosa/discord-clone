import { Module } from '@nestjs/common';
import { ServersModule } from '../servers/servers.module';
import { ReadStatesController } from './read-states.controller';
import { ReadStatesService } from './read-states.service';

@Module({
  imports: [ServersModule],
  controllers: [ReadStatesController],
  providers: [ReadStatesService],
})
export class ReadStatesModule {}
