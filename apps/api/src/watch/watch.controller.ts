import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtCookieGuard } from '../auth/jwt-cookie.guard';
import { WatchService } from './watch.service';

@Controller('watch')
@UseGuards(JwtCookieGuard)
export class WatchController {
  constructor(private readonly watch: WatchService) {}

  @Get('search')
  search(@Query('q') q: string) {
    return this.watch.search(q ?? '');
  }
}
