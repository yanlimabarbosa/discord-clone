import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthController } from './health/health.controller';
import { LivekitModule } from './livekit/livekit.module';
import { ServersModule } from './servers/servers.module';
import { ChannelsModule } from './channels/channels.module';
import { MessagesModule } from './messages/messages.module';
import { InvitesModule } from './invites/invites.module';
import { MembersModule } from './members/members.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { DmsModule } from './dms/dms.module';
import { ReadStatesModule } from './read-states/read-states.module';
import { PermissionsModule } from './permissions/permissions.module';
import { RolesModule } from './roles/roles.module';
import { VoiceModerationModule } from './voice-moderation/voice-moderation.module';
import { UploadsModule } from './uploads/uploads.module';
import { WatchModule } from './watch/watch.module';
import { GatewayModule } from './gateway/gateway.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    LivekitModule,
    GatewayModule,
    ServersModule,
    ChannelsModule,
    MessagesModule,
    InvitesModule,
    MembersModule,
    UsersModule,
    FriendsModule,
    DmsModule,
    ReadStatesModule,
    PermissionsModule,
    RolesModule,
    VoiceModerationModule,
    UploadsModule,
    WatchModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
