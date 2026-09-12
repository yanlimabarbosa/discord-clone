import { Module } from '@nestjs/common';
import { ServersModule } from '../servers/servers.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { RolesController } from './roles.controller';
import { RolesService } from './roles.service';

@Module({
  imports: [ServersModule, PermissionsModule],
  controllers: [RolesController],
  providers: [RolesService],
})
export class RolesModule {}
