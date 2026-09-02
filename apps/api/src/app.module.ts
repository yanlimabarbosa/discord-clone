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
  ],
  controllers: [HealthController],
})
export class AppModule {}
