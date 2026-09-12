import { Module } from '@nestjs/common';
import { PermissionsModule } from '../permissions/permissions.module';
import { GatewayModule } from '../gateway/gateway.module';
import { VoiceModerationController } from './voice-moderation.controller';
import { VoiceModerationService } from './voice-moderation.service';

@Module({
  imports: [PermissionsModule, GatewayModule],
  controllers: [VoiceModerationController],
  providers: [VoiceModerationService],
})
export class VoiceModerationModule {}
