import { Module } from '@nestjs/common';
import { GatewayModule } from '../gateway/gateway.module';
import { DmsController } from './dms.controller';
import { DmsService } from './dms.service';

@Module({
  imports: [GatewayModule],
  controllers: [DmsController],
  providers: [DmsService],
})
export class DmsModule {}
